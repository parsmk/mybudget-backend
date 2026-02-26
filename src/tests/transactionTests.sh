#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
API_ROOT="${API_ROOT:-/transaction}"
COOKIE_JAR="${COOKIE_JAR:-./cookies.txt}"

# These are required for create/bulk/patch unless you hardcode values in calls.
ACCOUNT_ID="${ACCOUNT_ID:-}"
CATEGORY_ID="${CATEGORY_ID:-}" # optional (can be blank)

# Optional defaults for convenience
DEFAULT_PAYEE="${DEFAULT_PAYEE:-Test Payee}"
DEFAULT_DATE="${DEFAULT_DATE:-2026-02-01}"

pp() { if command -v jq >/dev/null 2>&1; then jq .; else cat; fi; }
hr() { printf '\n%s\n' "------------------------------------------------------------"; }

require_cookiejar() {
  if [[ ! -f "$COOKIE_JAR" ]]; then
    echo "Missing cookie jar at $COOKIE_JAR. Login first (or set COOKIE_JAR)." >&2
    exit 1
  fi
}

require_account_id() {
  if [[ -z "${ACCOUNT_ID}" ]]; then
    echo "ACCOUNT_ID is required for this test. Set env var ACCOUNT_ID=..." >&2
    exit 1
  fi
}

# -------------------------------------------------------------------
# AUTH HELPERS (optional convenience)
# If you already have a cookie jar from your existing auth script,
# you can ignore these and just set COOKIE_JAR=... when running.
# -------------------------------------------------------------------
login() {
  local email="${1:?email required}"
  local password="${2:?password required}"

  hr
  echo "POST /login (stores cookies in $COOKIE_JAR)"
  : > "$COOKIE_JAR"

  curl -sS -i \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL/login" \
    --data "{\"email\":\"$email\",\"password\":\"$password\"}" \
  | tee /dev/stderr >/dev/null
}

refresh() {
  require_cookiejar
  hr
  echo "POST /refresh (uses refreshToken from $COOKIE_JAR; sets new accessToken)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -X POST "$BASE_URL/refresh" \
  | tee /dev/stderr >/dev/null
}

# -------------------------------------------------------------------
# /transaction ROUTES
#   POST   /transaction
#   POST   /transaction/bulk
#   GET    /transaction?from=YYYY-MM-DD&to=YYYY-MM-DD
#   PATCH  /transaction/:id
#   DELETE /transaction/:id
#   DELETE /transaction           (body: ["id1","id2",...])
# -------------------------------------------------------------------

tx_create_outflow() {
  require_cookiejar
  require_account_id

  local amount="${1:-12.34}"   # dollars
  local date="${2:-$DEFAULT_DATE}"
  local payee="${3:-$DEFAULT_PAYEE}"

  hr
  echo "POST $API_ROOT/ (outflow=$amount date=$date)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data "$(cat <<JSON
{
  "date": "$date",
  "payee": "$payee",
  "account_id": "$ACCOUNT_ID",
  "category_id": ${CATEGORY_ID:+\"$CATEGORY_ID\"}${CATEGORY_ID:+"",}${CATEGORY_ID:-null},
  "outflow": $amount
}
JSON
)" | pp
}

tx_create_inflow() {
  require_cookiejar
  require_account_id

  local amount="${1:-45.67}"   # dollars
  local date="${2:-$DEFAULT_DATE}"
  local payee="${3:-$DEFAULT_PAYEE}"

  hr
  echo "POST $API_ROOT/ (inflow=$amount date=$date)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data "$(cat <<JSON
{
  "date": "$date",
  "payee": "$payee",
  "account_id": "$ACCOUNT_ID",
  "category_id": ${CATEGORY_ID:+\"$CATEGORY_ID\"}${CATEGORY_ID:+"",}${CATEGORY_ID:-null},
  "inflow": $amount
}
JSON
)" | pp
}

tx_bulk_create_mixed() {
  require_cookiejar
  require_account_id

  hr
  echo "POST $API_ROOT/bulk (mixed payload, includes one invalid row)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/bulk" \
    --data "$(cat <<JSON
[
  {
    "date": "$DEFAULT_DATE",
    "payee": "Bulk Outflow",
    "account_id": "$ACCOUNT_ID",
    "category_id": ${CATEGORY_ID:+\"$CATEGORY_ID\"}${CATEGORY_ID:+"",}${CATEGORY_ID:-null},
    "outflow": 10.00
  },
  {
    "date": "$DEFAULT_DATE",
    "payee": "Bulk Inflow",
    "account_id": "$ACCOUNT_ID",
    "category_id": ${CATEGORY_ID:+\"$CATEGORY_ID\"}${CATEGORY_ID:+"",}${CATEGORY_ID:-null},
    "inflow": 25.00
  },
  {
    "date": "not-a-date",
    "payee": "Invalid Row",
    "account_id": "$ACCOUNT_ID",
    "outflow": 1.00
  }
]
JSON
)" | pp
}

tx_list() {
  require_cookiejar
  local from="${1:-}"
  local to="${2:-}"

  local qs=""
  [[ -n "$from" ]] && qs="${qs}${qs:+&}from=$from"
  [[ -n "$to"   ]] && qs="${qs}${qs:+&}to=$to"
  [[ -n "$qs"   ]] && qs="?$qs"

  hr
  echo "GET $API_ROOT/$qs"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/$qs" \
  | pp
}

tx_list_invalid_from() {
  require_cookiejar
  hr
  echo "GET $API_ROOT/?from=bad-date (expect 400 Invalid from query)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/?from=bad-date" \
  | tee /dev/stderr >/dev/null
}

tx_patch_set_outflow() {
  require_cookiejar
  local id="${1:?transaction id required}"
  local outflow="${2:-9.99}"

  hr
  echo "PATCH $API_ROOT/$id (set outflow=$outflow)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data "$(cat <<JSON
{ "outflow": $outflow, "inflow": null }
JSON
)" | pp
}

tx_patch_invalid_both_positive() {
  require_cookiejar
  local id="${1:?transaction id required}"

  hr
  echo "PATCH $API_ROOT/$id (inflow and outflow both >0; query-layer throws; expect 500)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data '{"inflow": 10, "outflow": 5}' \
  | tee /dev/stderr >/dev/null
}

tx_delete_one() {
  require_cookiejar
  local id="${1:?transaction id required}"

  hr
  echo "DELETE $API_ROOT/$id"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X DELETE "$BASE_URL$API_ROOT/$id" \
  | pp
}

tx_delete_many() {
  require_cookiejar
  shift || true # allow passing ids as args
  local ids=("$@")
  if [[ "${#ids[@]}" -lt 1 ]]; then
    echo "Provide 1+ ids." >&2
    exit 1
  fi

  hr
  echo "DELETE $API_ROOT/ (bulk delete ${#ids[@]} ids)"
  # build JSON array from args
  local json="["
  for i in "${!ids[@]}"; do
    [[ $i -gt 0 ]] && json+=","
    json+="\"${ids[$i]}\""
  done
  json+="]"

  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X DELETE "$BASE_URL$API_ROOT/" \
    --data "$json" \
  | pp
}

tx_delete_many_invalid_body() {
  require_cookiejar
  hr
  echo "DELETE $API_ROOT/ with non-array body (expect 400 instructing to use /transaction/{id})"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X DELETE "$BASE_URL$API_ROOT/" \
    --data '{"id":"not-an-array"}' \
  | tee /dev/stderr >/dev/null
}

usage() {
  cat <<'EOF'
Env:
  BASE_URL=http://localhost:5000
  API_ROOT=/transaction
  COOKIE_JAR=./cookies.txt
  ACCOUNT_ID=...        (required for create/bulk)
  CATEGORY_ID=...       (optional)

Commands:
  # auth (optional helpers)
  login <email> <password>
  refresh

  # transactions
  tx_create_outflow [amount] [date] [payee]
  tx_create_inflow  [amount] [date] [payee]
  tx_bulk_create_mixed
  tx_list [from] [to]
  tx_list_invalid_from
  tx_patch_set_outflow <id> [outflow]
  tx_patch_invalid_both_positive <id>
  tx_delete_one <id>
  tx_delete_many <id1> <id2> ...
  tx_delete_many_invalid_body

Examples:
  ACCOUNT_ID=... ./transaction_curl_tests.sh login test@example.com 'Passw0rd!'
  ACCOUNT_ID=... ./transaction_curl_tests.sh tx_create_outflow 12.34 2026-02-01 "Coffee"
  ./transaction_curl_tests.sh tx_list 2026-01-01 2026-03-01
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  login) login "$@" ;;
  refresh) refresh ;;
  tx_create_outflow) tx_create_outflow "$@" ;;
  tx_create_inflow) tx_create_inflow "$@" ;;
  tx_bulk_create_mixed) tx_bulk_create_mixed ;;
  tx_list) tx_list "$@" ;;
  tx_list_invalid_from) tx_list_invalid_from ;;
  tx_patch_set_outflow) tx_patch_set_outflow "$@" ;;
  tx_patch_invalid_both_positive) tx_patch_invalid_both_positive "$@" ;;
  tx_delete_one) tx_delete_one "$@" ;;
  tx_delete_many) tx_delete_many "$cmd" "$@" ;; # (ignore $cmd, function shifts anyway)
  tx_delete_many_invalid_body) tx_delete_many_invalid_body ;;
  ""|help|-h|--help) usage ;;
  *) echo "Unknown command: $cmd" >&2; usage; exit 1 ;;
esac