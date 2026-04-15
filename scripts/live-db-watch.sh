#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  source "$ROOT_DIR/.env.local"
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-cafe_curator}"
REFRESH_SECONDS="${REFRESH_SECONDS:-2}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/live-db-watch.sh all
  ./scripts/live-db-watch.sh table TABLE_NAME
  ./scripts/live-db-watch.sh query "SELECT ..."

Examples:
  ./scripts/live-db-watch.sh all
  ./scripts/live-db-watch.sh table Venue
  ./scripts/live-db-watch.sh table Review
  ./scripts/live-db-watch.sh query "SELECT * FROM Review ORDER BY DatePosted DESC LIMIT 10"
  REFRESH_SECONDS=1 ./scripts/live-db-watch.sh query "SELECT * FROM Check_In ORDER BY CheckInTime DESC LIMIT 20"

Modes:
  all
    Show every table and every row in the database.
  table
    Show one table only.
  query
    Show one custom SQL query.

Stop:
  Press Ctrl+C
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

MODE="$1"
shift

case "$MODE" in
  all)
    SQL=""
    ;;
  table)
    if [[ $# -lt 1 ]]; then
      usage
      exit 1
    fi
    TABLE_NAME="$1"
    SQL="SELECT * FROM \`$TABLE_NAME\`;"
    ;;
  query)
    if [[ $# -lt 1 ]]; then
      usage
      exit 1
    fi
    SQL="$*"
    ;;
  *)
    usage
    exit 1
    ;;
esac

while true; do
  clear
  echo "Cafe Curator live DB watcher"
  echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
  echo "Refresh: every ${REFRESH_SECONDS}s"
  echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo

  if [[ "$MODE" == "all" ]]; then
    echo "Mode: every table and every row"
    echo

    TABLES=("${(@f)$(MYSQL_PWD="$DB_PASSWORD" mysql \
      --protocol=TCP \
      -h "$DB_HOST" \
      -P "$DB_PORT" \
      -u "$DB_USER" \
      -D "$DB_NAME" \
      -N \
      -B \
      -e "SHOW TABLES;")}")

    for TABLE_NAME in "${TABLES[@]}"; do
      echo "================================================================"
      echo "TABLE: $TABLE_NAME"
      echo "================================================================"
      MYSQL_PWD="$DB_PASSWORD" mysql \
        --protocol=TCP \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -D "$DB_NAME" \
        -t \
        -e "SELECT * FROM \`$TABLE_NAME\`;"
      echo
    done
  else
    echo "SQL:"
    echo "$SQL"
    echo
    MYSQL_PWD="$DB_PASSWORD" mysql \
      --protocol=TCP \
      -h "$DB_HOST" \
      -P "$DB_PORT" \
      -u "$DB_USER" \
      -D "$DB_NAME" \
      -t \
      -e "$SQL"
  fi

  sleep "$REFRESH_SECONDS"
done
