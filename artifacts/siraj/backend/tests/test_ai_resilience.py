"""
Test suite for Siraj AI resilience layer.

Tests cover: caching, provider failover, retry logic, error classification,
fallback behavior, and write-tool safety blocking.

Run with: python -m pytest backend/tests/test_ai_resilience.py -v
"""

import time
import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

# ---------------------------------------------------------------------------
# Cache Tests
# ---------------------------------------------------------------------------

from backend.app.ai.ai_cache import ContextCache


class TestContextCache:
    """Tests for the in-memory TTL cache."""

    def test_set_and_get(self):
        """Cache returns stored value before TTL expires."""
        cache = ContextCache(ttl_seconds=60)
        cache.set("user1", "context data")
        result = cache.get("user1")
        assert result == "context data"

    def test_cache_miss(self):
        """Cache returns None for unknown keys."""
        cache = ContextCache(ttl_seconds=60)
        result = cache.get("nonexistent")
        assert result is None

    def test_cache_expiry(self):
        """Cache returns None after TTL expires."""
        cache = ContextCache(ttl_seconds=1)
        cache.set("user1", "old data")
        time.sleep(1.1)
        result = cache.get("user1")
        assert result is None

    def test_cache_hit_before_expiry(self):
        """Cache returns value when accessed before TTL."""
        cache = ContextCache(ttl_seconds=10)
        cache.set("user1", "fresh data")
        result = cache.get("user1")
        assert result == "fresh data"

    def test_invalidate(self):
        """Invalidating a key removes it from cache."""
        cache = ContextCache(ttl_seconds=60)
        cache.set("user1", "data")
        cache.invalidate("user1")
        assert cache.get("user1") is None

    def test_invalidate_nonexistent(self):
        """Invalidating a nonexistent key does not raise."""
        cache = ContextCache(ttl_seconds=60)
        cache.invalidate("ghost")  # Should not raise

    def test_clear(self):
        """Clearing removes all entries."""
        cache = ContextCache(ttl_seconds=60)
        cache.set("user1", "data1")
        cache.set("user2", "data2")
        cache.clear()
        assert cache.get("user1") is None
        assert cache.get("user2") is None

    def test_stats_tracking(self):
        """Stats correctly track hits and misses."""
        cache = ContextCache(ttl_seconds=60)
        cache.get("miss1")  # miss
        cache.set("hit1", "data")
        cache.get("hit1")   # hit
        cache.get("miss2")  # miss

        stats = cache.stats
        assert stats["hits"] == 1
        assert stats["misses"] == 2
        assert stats["active_entries"] == 1
        assert stats["hit_rate_pct"] == pytest.approx(33.3, abs=0.1)

    def test_overwrite_resets_ttl(self):
        """Re-setting a key resets its TTL."""
        cache = ContextCache(ttl_seconds=2)
        cache.set("user1", "old")
        time.sleep(1)
        cache.set("user1", "new")
        time.sleep(1.5)
        # Original would have expired, but re-set should still be valid
        result = cache.get("user1")
        assert result == "new"

    def test_cleanup_expired(self):
        """cleanup_expired removes only expired entries."""
        cache = ContextCache(ttl_seconds=1)
        cache.set("expires", "data")
        cache._store["fresh"] = cache._store["expires"].__class__(
            value="fresh_data",
            expires_at=time.time() + 60,
            created_at=time.time(),
        )
        time.sleep(1.1)
        removed = cache.cleanup_expired()
        assert removed == 1
        assert cache.get("fresh") is not None


# ---------------------------------------------------------------------------
# Error Classification Tests
# ---------------------------------------------------------------------------

from backend.app.ai.ai_provider import (
    _classify_error,
    _is_retryable,
    ErrorCategory,
    FALLBACK_MESSAGE_AR,
)


class TestErrorClassification:
    """Tests for error classification and retry decisions."""

    def test_rate_limit_429(self):
        """HTTP 429 errors are classified as rate_limit."""
        exc = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
        assert _classify_error(exc) == ErrorCategory.RATE_LIMIT

    def test_rate_limit_keyword(self):
        """Rate limit keyword in error message."""
        exc = Exception("Rate limit exceeded, please retry")
        assert _classify_error(exc) == ErrorCategory.RATE_LIMIT

    def test_timeout(self):
        """Timeout errors are classified correctly."""
        exc = Exception("Request timed out after 30 seconds")
        assert _classify_error(exc) == ErrorCategory.TIMEOUT

    def test_auth_error_401(self):
        """HTTP 401 errors are auth errors."""
        exc = Exception("401 UNAUTHENTICATED: invalid API key")
        assert _classify_error(exc) == ErrorCategory.AUTH_ERROR

    def test_model_not_found_404(self):
        """HTTP 404 errors (model deprecation) are not retryable."""
        exc = Exception("404 NOT_FOUND: model is no longer available")
        assert _classify_error(exc) == ErrorCategory.MODEL_NOT_FOUND

    def test_service_unavailable_503(self):
        """HTTP 503 errors are retryable."""
        exc = Exception("503 Service Unavailable")
        assert _classify_error(exc) == ErrorCategory.SERVICE_DOWN

    def test_network_error(self):
        """Network/connection errors are retryable."""
        exc = Exception("Connection refused")
        assert _classify_error(exc) == ErrorCategory.NETWORK_ERROR

    def test_unknown_error(self):
        """Unrecognized errors are classified as unknown."""
        exc = Exception("Something completely unexpected")
        assert _classify_error(exc) == ErrorCategory.UNKNOWN

    def test_retryable_errors(self):
        """Rate limit, timeout, service down, network are retryable."""
        assert _is_retryable(ErrorCategory.RATE_LIMIT) is True
        assert _is_retryable(ErrorCategory.TIMEOUT) is True
        assert _is_retryable(ErrorCategory.SERVICE_DOWN) is True
        assert _is_retryable(ErrorCategory.NETWORK_ERROR) is True

    def test_non_retryable_errors(self):
        """Auth and model-not-found are NOT retryable."""
        assert _is_retryable(ErrorCategory.AUTH_ERROR) is False
        assert _is_retryable(ErrorCategory.MODEL_NOT_FOUND) is False
        assert _is_retryable(ErrorCategory.UNKNOWN) is False


# ---------------------------------------------------------------------------
# Provider Tests
# ---------------------------------------------------------------------------

from backend.app.ai.ai_provider import AIProvider, ProviderName, ProviderResponse


class TestAIProvider:
    """Tests for the multi-provider abstraction."""

    @pytest.mark.asyncio
    async def test_gemini_success(self):
        """Primary provider (Gemini) succeeds on first try."""
        provider = AIProvider()
        mock_response = MagicMock()
        mock_response.function_calls = None
        mock_response.text = "مرحباً!"

        with patch("backend.app.ai.ai_provider._call_gemini", new_callable=AsyncMock) as mock_gemini:
            mock_gemini.return_value = mock_response
            with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.OPENAI_API_KEY = ""
                mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                mock_settings.AI_SECONDARY_MODEL = ""
                mock_settings.AI_RETRY_MAX = 3
                mock_settings.AI_RETRY_BASE_DELAY = 0.01
                mock_settings.AI_REQUEST_TIMEOUT = 5

                result = await provider.generate_content(
                    contents=[],
                    config=MagicMock(),
                )

        assert result.provider == ProviderName.GEMINI
        assert result.response is not None
        assert result.is_fallback is False
        assert result.retries == 0

    @pytest.mark.asyncio
    async def test_429_retry_then_success(self):
        """Gemini fails with 429 once, then succeeds on retry."""
        provider = AIProvider()
        mock_response = MagicMock()
        mock_response.text = "نجح"

        call_count = 0

        async def mock_call(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
            return mock_response

        with patch("backend.app.ai.ai_provider._call_gemini", side_effect=mock_call):
            with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.OPENAI_API_KEY = ""
                mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                mock_settings.AI_SECONDARY_MODEL = ""
                mock_settings.AI_RETRY_MAX = 3
                mock_settings.AI_RETRY_BASE_DELAY = 0.01
                mock_settings.AI_REQUEST_TIMEOUT = 5

                result = await provider.generate_content(
                    contents=[],
                    config=MagicMock(),
                )

        assert result.provider == ProviderName.GEMINI
        assert result.retries == 1
        assert result.response is not None

    @pytest.mark.asyncio
    async def test_auth_error_skips_immediately(self):
        """401 auth error skips to next provider without retrying."""
        provider = AIProvider()

        with patch("backend.app.ai.ai_provider._call_gemini", new_callable=AsyncMock) as mock_gemini:
            mock_gemini.side_effect = Exception("401 UNAUTHENTICATED: invalid API key")
            with patch("backend.app.ai.ai_provider._openai_available", return_value=False):
                with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                    mock_settings.GEMINI_API_KEY = "bad-key"
                    mock_settings.OPENAI_API_KEY = ""
                    mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                    mock_settings.AI_SECONDARY_MODEL = ""
                    mock_settings.AI_RETRY_MAX = 3
                    mock_settings.AI_RETRY_BASE_DELAY = 0.01
                    mock_settings.AI_REQUEST_TIMEOUT = 5

                    result = await provider.generate_content(
                        contents=[],
                        config=MagicMock(),
                    )

        # Should be fallback since auth error is non-retryable and OpenAI is not available
        assert result.is_fallback is True
        assert result.fallback_message == FALLBACK_MESSAGE_AR

    @pytest.mark.asyncio
    async def test_all_providers_fail_returns_arabic_fallback(self):
        """When all providers fail, returns the Arabic apology message."""
        provider = AIProvider()

        with patch("backend.app.ai.ai_provider._call_gemini", new_callable=AsyncMock) as mock_gemini:
            mock_gemini.side_effect = Exception("429 rate limit")
            with patch("backend.app.ai.ai_provider._openai_available", return_value=False):
                with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                    mock_settings.GEMINI_API_KEY = "test-key"
                    mock_settings.OPENAI_API_KEY = ""
                    mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                    mock_settings.AI_SECONDARY_MODEL = ""
                    mock_settings.AI_RETRY_MAX = 2
                    mock_settings.AI_RETRY_BASE_DELAY = 0.01
                    mock_settings.AI_REQUEST_TIMEOUT = 5

                    result = await provider.generate_content(
                        contents=[],
                        config=MagicMock(),
                    )

        assert result.is_fallback is True
        assert result.provider == ProviderName.FALLBACK
        assert "عذراً" in result.fallback_message
        assert result.response is None

    @pytest.mark.asyncio
    async def test_fallback_has_no_function_calls(self):
        """Fallback response must NEVER contain function calls."""
        provider = AIProvider()

        with patch("backend.app.ai.ai_provider._call_gemini", new_callable=AsyncMock) as mock_gemini:
            mock_gemini.side_effect = Exception("503 Service Unavailable")
            with patch("backend.app.ai.ai_provider._openai_available", return_value=False):
                with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                    mock_settings.GEMINI_API_KEY = "test-key"
                    mock_settings.OPENAI_API_KEY = ""
                    mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                    mock_settings.AI_SECONDARY_MODEL = ""
                    mock_settings.AI_RETRY_MAX = 1
                    mock_settings.AI_RETRY_BASE_DELAY = 0.01
                    mock_settings.AI_REQUEST_TIMEOUT = 5

                    result = await provider.generate_content(
                        contents=[],
                        config=MagicMock(),
                    )

        assert result.is_fallback is True
        # Fallback should have no response object (no function calls possible)
        assert result.response is None


# ---------------------------------------------------------------------------
# Agent Loop Write-Tool Safety Tests
# ---------------------------------------------------------------------------

from backend.app.ai.agent_loop import WRITE_TOOLS, _get_tool_status_msg


class TestWriteToolSafety:
    """Tests for write-tool safety classification."""

    def test_write_tools_classified(self):
        """All transactional tools are in the WRITE_TOOLS set."""
        expected_write = {
            "add_transaction",
            "set_budget",
            "create_savings_plan",
            "create_spending_alert",
            "submit_financing_request",
            "submit_investment_request",
            "create_financial_goal",
        }
        assert WRITE_TOOLS == expected_write

    def test_read_tools_not_in_write_set(self):
        """Read-only tools are NOT in WRITE_TOOLS."""
        read_tools = [
            "get_transactions",
            "get_financial_summary",
            "get_category_breakdown",
            "get_budget_analysis",
            "get_recurring_charges",
            "get_financing_status",
            "get_investment_recommendations",
            "simulate_scenario",
        ]
        for tool in read_tools:
            assert tool not in WRITE_TOOLS, f"{tool} should not be in WRITE_TOOLS"


class TestToolStatusMessages:
    """Tests for Arabic tool status messages."""

    def test_known_tool_returns_arabic(self):
        """Known tools return their Arabic status message."""
        msg = _get_tool_status_msg("get_transactions")
        assert "المعاملات" in msg

    def test_unknown_tool_returns_default(self):
        """Unknown tools return a default Arabic message."""
        msg = _get_tool_status_msg("unknown_tool_xyz")
        assert "unknown_tool_xyz" in msg
        assert "جاري" in msg


# ---------------------------------------------------------------------------
# Logging Structure Tests
# ---------------------------------------------------------------------------

class TestLoggingStructure:
    """Tests that log messages contain required structured fields."""

    @pytest.mark.asyncio
    async def test_success_log_contains_fields(self):
        """Successful API call log contains provider, latency, retries."""
        import logging

        provider = AIProvider()
        mock_response = MagicMock()

        log_messages = []
        handler = logging.Handler()
        handler.emit = lambda record: log_messages.append(record.getMessage())

        test_logger = logging.getLogger("siraj.ai.provider")
        test_logger.addHandler(handler)
        test_logger.setLevel(logging.DEBUG)

        try:
            with patch("backend.app.ai.ai_provider._call_gemini", new_callable=AsyncMock) as mock_gemini:
                mock_gemini.return_value = mock_response
                with patch("backend.app.ai.ai_provider.settings") as mock_settings:
                    mock_settings.GEMINI_API_KEY = "test-key"
                    mock_settings.OPENAI_API_KEY = ""
                    mock_settings.AI_PRIMARY_MODEL = "gemini-3.5-flash"
                    mock_settings.AI_SECONDARY_MODEL = ""
                    mock_settings.AI_RETRY_MAX = 1
                    mock_settings.AI_RETRY_BASE_DELAY = 0.01
                    mock_settings.AI_REQUEST_TIMEOUT = 5

                    await provider.generate_content(
                        contents=[],
                        config=MagicMock(),
                    )

            # Check that a success log was emitted with required fields
            success_logs = [m for m in log_messages if "API_SUCCESS" in m]
            assert len(success_logs) >= 1
            log_msg = success_logs[0]
            assert "provider=" in log_msg
            assert "latency_ms=" in log_msg
            assert "retries=" in log_msg

        finally:
            test_logger.removeHandler(handler)
