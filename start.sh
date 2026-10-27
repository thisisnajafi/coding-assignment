#!/usr/bin/env bash
# One-command start for the whole stack.
#   ./start.sh           local demo   (http://localhost:3000)
#   ./start.sh --prod    production override (docker-compose.prod.yml, ports 8310/3310)
#   ./start.sh --stop    stop containers (data volume is kept)
set -euo pipefail
cd "$(dirname "$0")"

FILES=(-f docker-compose.yml)
MODE=local
STOP=0
for a in "$@"; do
  case "$a" in
    --prod) MODE=prod ;;
    --stop|stop) STOP=1 ;;
    *) echo "Unknown option: $a" >&2; exit 2 ;;
  esac
done
if [ "$MODE" = prod ]; then
  FILES+=(-f docker-compose.prod.yml)
  export BACKEND_PORT="${BACKEND_PORT:-8310}" FRONTEND_PORT="${FRONTEND_PORT:-3310}"
else
  export BACKEND_PORT="${BACKEND_PORT:-8000}" FRONTEND_PORT="${FRONTEND_PORT:-3000}"
fi

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 ('docker compose') is not available." >&2; exit 1; }

if [ "$STOP" = 1 ]; then
  docker compose "${FILES[@]}" down
  echo "Stopped. Data is kept (use 'docker compose down -v' only if you want to wipe the database)."
  exit 0
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from backend/.env.example."
  echo "Fill GAPGPT_API_KEY in backend/.env to enable real AI (the app works without it, using the fallback)."
fi

docker compose "${FILES[@]}" up -d --build

wait_for() {
  local name="$1" url="$2"
  for _ in $(seq 1 90); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then echo "$name is up."; return 0; fi
    sleep 2
  done
  echo "$name did not respond at $url in time. Check: docker compose logs" >&2
  return 1
}
wait_for "Backend" "http://127.0.0.1:${BACKEND_PORT}/api/health"
wait_for "Frontend" "http://127.0.0.1:${FRONTEND_PORT}/"

echo
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo "Backend:  http://localhost:${BACKEND_PORT}  (health: /api/health)"
if [ "$MODE" = prod ]; then echo "Stop with: ./start.sh --stop --prod"; else echo "Stop with: ./start.sh --stop"; fi
