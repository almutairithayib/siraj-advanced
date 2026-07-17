---
name: Siraj backend setup
description: FastAPI Python backend running in the Siraj artifact on Replit NixOS.
---

## Rules

- Python binary: `/home/runner/workspace/.pythonlibs/bin/python3`
- Packages in: `/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages`
- Set `PYTHONPATH=$SCRIPT_DIR:$PYTHONLIBS/lib/python3.11/site-packages`
- Always set `SIRAJ_DATABASE_URL=sqlite+aiosqlite:///./siraj.db` in start script to override system `DATABASE_URL` (which points to shared Replit Postgres that needs asyncpg — not installed).
- Start command: `exec "$PYTHON" -m uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-8001}"`
- Working dir must be `artifacts/siraj/` so `from backend.app.xxx` imports resolve.

**Why:** System DATABASE_URL is PostgreSQL; asyncpg is not available. SQLite + aiosqlite works fine and is pre-installed.

## GitHub repo
`https://github.com/almutairithayib/siraj-advanced.git` — main branch
