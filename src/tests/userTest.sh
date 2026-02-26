#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR="${COOKIE_JAR:-./cookies.txt}"

# If jq is installed, responses are pretty-printed; otherwise raw.
pp() {
  if command -v jq >/dev/null 2>&1; then jq .; else cat; fi
}

hr() { printf '\n%s\n' "------------------------------------------------------------"; }

# -----------------------------
# ROUTES (root = "/")
#   POST /signup   -> creates user (unverified) and triggers email verification
#   GET  /verify   -> verifies user using query params token + id
#   POST /login    -> sets refreshToken + accessToken cookies (httpOnly)
#   POST /refresh  -> reads refreshToken cookie, sets new accessToken cookie
#   POST /logout   -> clears cookies
# -----------------------------

signup() {
  local email="${1:?email required}"
  local password="${2:?password required}"

  hr
  echo "POST /signup (email=$email)"
  curl -sS -i \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL/signup" \
    --data "{\"email\":\"$email\",\"password\":\"$password\"}" \
  | tee /dev/stderr \
  | sed -n '1,/^\r\?$/p' >/dev/null

  echo
  echo "Body:"
  curl -sS \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL/signup" \
    --data "{\"email\":\"$email\",\"password\":\"$password\"}" \
  | pp || true
}

verify() {
  local id="${1:?id required}"
  local token="${2:?token required}"

  hr
  echo "GET /verify?id=$id&token=$token"
  # Note: endpoint redirects to FRONT_END on success
  curl -sS -i \
    -L \
    "$BASE_URL/verify?$(printf 'id=%s&token=%s' "$id" "$token")" \
  | tee /dev/stderr >/dev/null
}

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

  echo
  echo "Cookie jar contents:"
  cat "$COOKIE_JAR" || true
}

refresh() {
  hr
  echo "POST /refresh (uses refreshToken from $COOKIE_JAR; sets new accessToken)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -X POST "$BASE_URL/refresh" \
  | tee /dev/stderr >/dev/null

  echo
  echo "Cookie jar contents:"
  cat "$COOKIE_JAR" || true
}

logout() {
  hr
  echo "POST /logout (clears cookies)"
  curl -sS -i \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -X POST "$BASE_URL/logout" \
  | tee /dev/stderr >/dev/null

  echo
  echo "Cookie jar contents:"
  cat "$COOKIE_JAR" || true
}

# -----------------------------
# Negative / edge tests
# -----------------------------

login_bad_password() {
  local email="${1:?email required}"
  hr
  echo "POST /login (bad password -> expect 401)"
  curl -sS -i \
    -H "Content-Type: application/json" \
    -X POST "$BASE_URL/login" \
    --data "{\"email\":\"$email\",\"password\":\"wrong-password\"}" \
  | tee /dev/stderr >/dev/null
}

refresh_no_cookie() {
  hr
  echo "POST /refresh (no cookie -> expect 401)"
  curl -sS -i -X POST "$BASE_URL/refresh" \
  | tee /dev/stderr >/dev/null
}

verify_missing_params() {
  hr
  echo "GET /verify (missing params -> expect 400 + fieldErrors)"
  curl -sS -i "$BASE_URL/verify" \
  | tee /dev/stderr >/dev/null
}

# -----------------------------
# Usage
# -----------------------------
usage() {
  cat <<'EOF'
Usage:
  BASE_URL=http://localhost:5000 COOKIE_JAR=./cookies.txt ./auth_curl_tests.sh <command> [args...]

Commands:
  signup <email> <password>
  verify <id> <token>
  login <email> <password>
  refresh
  logout

Negative tests:
  login_bad_password <email>
  refresh_no_cookie
  verify_missing_params

Examples:
  ./auth_curl_tests.sh signup test+1@example.com 'Passw0rd!'
  ./auth_curl_tests.sh verify <user_id> <verification_token>
  ./auth_curl_tests.sh login test+1@example.com 'Passw0rd!'
  ./auth_curl_tests.sh refresh
  ./auth_curl_tests.sh logout
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  signup) signup "$@" ;;
  verify) verify "$@" ;;
  login) login "$@" ;;
  refresh) refresh ;;
  logout) logout ;;
  login_bad_password) login_bad_password "$@" ;;
  refresh_no_cookie) refresh_no_cookie ;;
  verify_missing_params) verify_missing_params ;;
  ""|help|-h|--help) usage ;;
  *) echo "Unknown command: $cmd" >&2; usage; exit 1 ;;
esac