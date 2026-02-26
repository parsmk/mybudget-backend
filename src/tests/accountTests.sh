#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
API_ROOT="${API_ROOT:-/account}"
COOKIE_JAR="${COOKIE_JAR:-./cookies.txt}"

# Must match your account type enum in models/account (set this to a valid value).
ACCOUNT_TYPE="${ACCOUNT_TYPE:-chequing}"

pp() { if command -v jq >/dev/null 2>&1; then jq .; else cat; fi; }
hr() { printf '\n%s\n' "------------------------------------------------------------"; }

require_cookiejar() {
  if [[ ! -f "$COOKIE_JAR" ]]; then
    echo "Missing cookie jar at $COOKIE_JAR. Login first (or set COOKIE_JAR)." >&2
    exit 1
  fi
}

# -------------------------------------------------------------------
# ROUTES (root = /account)
#   POST   /account
#   POST   /account/bulk
#   GET    /account
#   GET    /account/:id
#   GET    /account/:id/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
#   GET    /account/:id/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
#   PATCH  /account/:id
#   DELETE /account/:id
# -------------------------------------------------------------------

account_create() {
  require_cookiejar
  local name="${1:-Test Account}"
  local balance="${2:-123.45}" # dollars
  local type="${3:-$ACCOUNT_TYPE}"

  hr
  echo "POST $API_ROOT/ (name='$name' balance=$balance type='$type')"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data "$(cat <<JSON
{ "name": "$name", "balance": $balance, "type": "$type" }
JSON
)" | pp
}

account_create_invalid() {
  require_cookiejar
  hr
  echo "POST $API_ROOT/ (invalid body -> expect 400 zod flattenError)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data '{"name": 123, "balance": "nope", "type": "bad"}' \
  | tee /dev/stderr >/dev/null
}

account_bulk_create_mixed() {
  require_cookiejar
  local type="${1:-$ACCOUNT_TYPE}"

  hr
  echo "POST $API_ROOT/bulk (2 valid + 1 invalid row; expect 200 with uploaded + indexed errs)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/bulk" \
    --data "$(cat <<JSON
[
  { "name": "Bulk A", "balance": 10.00, "type": "$type" },
  { "name": "Bulk B", "balance": 25.50, "type": "$type" },
  { "name": 999, "balance": "bad", "type": "bad" }
]
JSON
)" | pp
}

account_list() {
  require_cookiejar
  hr
  echo "GET $API_ROOT/"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/" \
  | pp
}

account_get() {
  require_cookiejar
  local id="${1:?account id required}"

  hr
  echo "GET $API_ROOT/$id"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$id" \
  | pp
}

account_get_404() {
  require_cookiejar
  local id="${1:-00000000-0000-0000-0000-000000000000}"

  hr
  echo "GET $API_ROOT/$id (expect 404 Account not found)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$id" \
  | tee /dev/stderr >/dev/null
}

account_transactions() {
  require_cookiejar
  local id="${1:?account id required}"
  local from="${2:-}"
  local to="${3:-}"

  local qs=""
  [[ -n "$from" ]] && qs="${qs}${qs:+&}from=$from"
  [[ -n "$to"   ]] && qs="${qs}${qs:+&}to=$to"
  [[ -n "$qs"   ]] && qs="?$qs"

  hr
  echo "GET $API_ROOT/$id/transactions$qs"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$id/transactions$qs" \
  | pp
}

account_transactions_invalid_from() {
  require_cookiejar
  local id="${1:?account id required}"

  hr
  echo "GET $API_ROOT/$id/transactions?from=bad-date (expect 400 Invalid from query)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$id/transactions?from=bad-date" \
  | tee /dev/stderr >/dev/null
}

account_analytics() {
  require_cookiejar
  local id="${1:?account id required}"
  local from="${2:-}"
  local to="${3:-}"

  local qs=""
  [[ -n "$from" ]] && qs="${qs}${qs:+&}from=$from"
  [[ -n "$to"   ]] && qs="${qs}${qs:+&}to=$to"
  [[ -n "$qs"   ]] && qs="?$qs"

  hr
  echo "GET $API_ROOT/$id/analytics$qs"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$id/analytics$qs" \
  | pp
}

account_patch() {
  require_cookiejar
  local id="${1:?account id required}"
  local name="${2:-Renamed Account}"
  local balance="${3:-222.22}"
  local type="${4:-$ACCOUNT_TYPE}"

  hr
  echo "PATCH $API_ROOT/$id (name='$name' balance=$balance type='$type')"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data "$(cat <<JSON
{ "name": "$name", "balance": $balance, "type": "$type" }
JSON
)" | pp
}

account_patch_invalid() {
  require_cookiejar
  local id="${1:?account id required}"

  hr
  echo "PATCH $API_ROOT/$id (invalid body -> expect 400 zod flattenError)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data '{"balance":"nope"}' \
  | tee /dev/stderr >/dev/null
}

account_delete() {
  require_cookiejar
  local id="${1:?account id required}"

  hr
  echo "DELETE $API_ROOT/$id"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X DELETE "$BASE_URL$API_ROOT/$id" \
  | pp
}

usage() {
  cat <<'EOF'
Env:
  BASE_URL=http://localhost:5000
  API_ROOT=/account
  COOKIE_JAR=./cookies.txt
  ACCOUNT_TYPE=chequing   (must match your enum)

Commands:
  account_create [name] [balance] [type]
  account_create_invalid
  account_bulk_create_mixed [type]
  account_list
  account_get <id>
  account_get_404 [id]
  account_transactions <id> [from] [to]
  account_transactions_invalid_from <id>
  account_analytics <id> [from] [to]
  account_patch <id> [name] [balance] [type]
  account_patch_invalid <id>
  account_delete <id>

Examples:
  # assumes you already logged in and created cookies.txt
  ./account_curl_tests.sh account_create "Chequing" 500.00 chequing
  ./account_curl_tests.sh account_list
  ./account_curl_tests.sh account_transactions <account_id> 2026-01-01 2026-03-01
  ./account_curl_tests.sh account_analytics <account_id> 2026-01-01 2026-03-01
  ./account_curl_tests.sh account_patch <account_id> "Chequing (Main)" 750.00 chequing
  ./account_curl_tests.sh account_delete <account_id>
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  account_create) account_create "$@" ;;
  account_create_invalid) account_create_invalid ;;
  account_bulk_create_mixed) account_bulk_create_mixed "$@" ;;
  account_list) account_list ;;
  account_get) account_get "$@" ;;
  account_get_404) account_get_404 "$@" ;;
  account_transactions) account_transactions "$@" ;;
  account_transactions_invalid_from) account_transactions_invalid_from "$@" ;;
  account_analytics) account_analytics "$@" ;;
  account_patch) account_patch "$@" ;;
  account_patch_invalid) account_patch_invalid "$@" ;;
  account_delete) account_delete "$@" ;;
  ""|help|-h|--help) usage ;;
  *) echo "Unknown command: $cmd" >&2; usage; exit 1 ;;
esac