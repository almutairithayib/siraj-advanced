#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PYTHONLIBS="/home/runner/workspace/.pythonlibs"

# Use known working Python path (set by installProgrammingLanguage)
if [ -f "$PYTHONLIBS/bin/python3" ]; then
  PYTHON="$PYTHONLIBS/bin/python3"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="python3"
else
  echo "ERROR: Python not found!"
  exit 1
fi

export PYTHONPATH="$SCRIPT_DIR:$PYTHONLIBS/lib/python3.11/site-packages"
export SIRAJ_DATABASE_URL="sqlite+aiosqlite:///./siraj.db"

echo "Using Python: $PYTHON"
echo "Database: $SIRAJ_DATABASE_URL"
echo "Starting Siraj FastAPI backend on port ${PORT:-8001}..."

exec "$PYTHON" -m uvicorn backend.app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8001}" \
  --log-level info
