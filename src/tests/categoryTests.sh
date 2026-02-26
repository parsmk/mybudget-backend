#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
API_ROOT="${API_ROOT:-/category}"
COOKIE_JAR="${COOKIE_JAR:-./cookies.txt}"

pp() { if command -v jq >/dev/null 2>&1; then jq .; else cat; fi; }
hr() { printf '\n%s\n' "------------------------------------------------------------"; }

require_cookiejar() {
  if [[ ! -f "$COOKIE_JAR" ]]; then
    echo "Missing cookie jar at $COOKIE_JAR. Login first (or set COOKIE_JAR)." >&2
    exit 1
  fi
}

# -------------------------------------------------------------------
# ROUTES (root = /category)
#   POST   /category
#   POST   /category/bulk
#   GET    /category
#   PATCH  /category/:id
#   DELETE /category/:id
# -------------------------------------------------------------------

category_create() {
  require_cookiejar
  local name="${1:-Test Category}"

  hr
  echo "POST $API_ROOT/ (name='$name')"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data "$(cat <<JSON
{ "name": "$name" }
JSON
)" | pp
}

category_create_invalid() {
  require_cookiejar
  hr
  echo "POST $API_ROOT/ (invalid body -> expect 400 zod.flattenError)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/" \
    --data '{"name": 123}' \
  | tee /dev/stderr >/dev/null
}

category_bulk_create_mixed() {
  require_cookiejar
  hr
  echo "POST $API_ROOT/bulk (2 valid + 1 invalid; expect 200 with uploaded + indexed errs)"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL$API_ROOT/bulk" \
    --data "$(cat <<JSON
[
  { "name": "Bulk A" },
  { "name": "Bulk B" },
  { "name": 999 }
]
JSON
)" | pp
}

category_list() {
  require_cookiejar
  hr
  echo "GET $API_ROOT/"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X GET "$BASE_URL$API_ROOT/" \
  | pp
}

category_patch() {
  require_cookiejar
  local id="${1:?category id required}"
  local name="${2:-Renamed Category}"

  hr
  echo "PATCH $API_ROOT/$id (name='$name')"
  curl -sS \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data "$(cat <<JSON
{ "name": "$name" }
JSON
)" | pp
}

category_patch_invalid() {
  require_cookiejar
  local id="${1:?category id required}"

  hr
  echo "PATCH $API_ROOT/$id (invalid body -> expect 400 zod.flattenError)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data '{"name": 123}' \
  | tee /dev/stderr >/dev/null
}

category_patch_404() {
  require_cookiejar
  local id="${1:-00000000-0000-0000-0000-000000000000}"

  hr
  echo "PATCH $API_ROOT/$id (expect 404 Could not find category)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -X PATCH "$BASE_URL$API_ROOT/$id" \
    --data '{"name":"Nope"}' \
  | tee /dev/stderr >/dev/null
}

category_delete() {
  require_cookiejar
  local id="${1:?category id required}"

  hr
  echo "DELETE $API_ROOT/$id"
  curl -sS \
    -b "$COOKIE_JAR" \
    -X DELETE "$BASE_URL$API_ROOT/$id" \
  | pp
}

category_delete_404() {
  require_cookiejar
  local id="${1:-00000000-0000-0000-0000-000000000000}"

  hr
  echo "DELETE $API_ROOT/$id (expect 404 Could not find category)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -X DELETE "$BASE_URL$API_ROOT/$id" \
  | tee /dev/stderr >/dev/null
}

usage() {
  cat <<'EOF'
Env:
  BASE_URL=http://localhost:5000
  API_ROOT=/category
  COOKIE_JAR=./cookies.txt

Commands:
  category_create [name]
  category_create_invalid
  category_bulk_create_mixed
  category_list
  category_patch <id> [name]
  category_patch_invalid <id>
  category_patch_404 [id]
  category_delete <id>
  category_delete_404 [id]

Examples:
  ./category_curl_tests.sh category_create "Groceries"
  ./category_curl_tests.sh category_list
  ./category_curl_tests.sh category_patch <category_id> "Groceries (Food)"
  ./category_curl_tests.sh category_delete <category_id>
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  category_create) category_create "$@" ;;
  category_create_invalid) category_create_invalid ;;
  category_bulk_create_mixed) category_bulk_create_mixed ;;
  category_list) category_list ;;
  category_patch) category_patch "$@" ;;
  category_patch_invalid) category_patch_invalid "$@" ;;
  category_patch_404) category_patch_404 "$@" ;;
  category_delete) category_delete "$@" ;;
  category_delete_404) category_delete_404 "$@" ;;
  ""|help|-h|--help) usage ;;
  *) echo "Unknown command: $cmd" >&2; usage; exit 1 ;;
esac