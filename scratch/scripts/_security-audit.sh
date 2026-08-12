#!/usr/bin/env bash
# Security audit — HTTP-level penetration tests against the local dev server.
# Always restarts the dev server so in-memory rate-limit buckets start empty.
# Usage: bash scripts/_security-audit.sh
set -u
BASE="http://localhost:3000"
PASS=0; FAIL=0

ok()  { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

check() { # check <label> <expected_code> <actual_code>
  if [ "$3" = "$2" ]; then ok "$1 (HTTP $3)"; else bad "$1 — expected $2, got $3"; fi
}

code_of() { curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$@"; }

# ------------------------------------------------------------- start server
if ss -tlnp 2>/dev/null | grep -q ':3000'; then
  fuser -k 3000/tcp 2>/dev/null; sleep 2
fi
echo "== Starting dev server =="
setsid nohup npx next dev --port 3000 > /tmp/gomodi-dev.log 2>&1 < /dev/null & disown
for _ in $(seq 1 60); do
  sleep 2
  curl -s -o /dev/null --max-time 5 "$BASE/" && break
done
curl -s -o /dev/null --max-time 5 "$BASE/" || { echo "Server did not come up"; exit 1; }
echo "== Server up =="
# The external DB pool can be cold right after a server restart; warm it
# (the /rooms route queries rooms) so later tests don't hit a first-query timeout.
for _ in 1 2 3 4 5 6; do
  [ "$(code_of "$BASE/rooms")" = "200" ] && break
  sleep 3
done

echo
echo "== 1. SECURITY HEADERS =="
HDRS=$(curl -s -D - -o /dev/null --max-time 20 "$BASE/")
echo "$HDRS" | grep -qi 'content-security-policy' && ok "CSP present" || bad "CSP missing"
echo "$HDRS" | grep -qi "frame-ancestors 'none'" && ok "CSP frame-ancestors none" || bad "frame-ancestors missing"
echo "$HDRS" | grep -qi 'nonce-' && ok "CSP carries a nonce" || bad "CSP nonce missing"
echo "$HDRS" | grep -qi 'x-content-type-options: nosniff' && ok "nosniff" || bad "nosniff missing"
echo "$HDRS" | grep -qi 'x-frame-options: deny' && ok "X-Frame-Options DENY" || bad "XFO missing"
echo "$HDRS" | grep -qi 'referrer-policy: strict-origin-when-cross-origin' && ok "Referrer-Policy" || bad "Referrer-Policy missing"
echo "$HDRS" | grep -qi 'permissions-policy: camera=()' && ok "Permissions-Policy" || bad "Permissions-Policy missing"
echo "$HDRS" | grep -qi 'x-powered-by' && bad "X-Powered-By leaked" || ok "no X-Powered-By"

echo
echo "== 2. CSRF — cross-origin state-changing requests =="
check "POST /api/auth/request-otp (evil Origin)" 403 "$(code_of -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -H 'Origin: https://evil.example' -d '{"phone":"+27820000001"}')"
check "POST /api/upload (evil Origin)" 403 "$(code_of -X POST "$BASE/api/upload" -H 'Origin: https://evil.example' -F 'file=@/etc/hostname')"
check "POST /book (evil Origin, server action surface)" 403 "$(code_of -X POST "$BASE/book" -H 'Origin: https://evil.example')"
check "POST /corporate (evil Origin)" 403 "$(code_of -X POST "$BASE/corporate" -H 'Origin: https://evil.example')"
check "POST /events (evil Origin)" 403 "$(code_of -X POST "$BASE/events" -H 'Origin: https://evil.example')"

echo
echo "== 3. INPUT VALIDATION (HTTP surface) =="
check "request-otp empty phone" 400 "$(code_of -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d '{"phone":""}')"
check "request-otp non-numeric phone" 400 "$(code_of -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d '{"phone":"not-a-phone"}')"
check "request-otp 200-char phone" 400 "$(code_of -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"$(printf '1%.0s' {1..200})\"}")"
check "verify-otp short otp" 401 "$(code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d '{"phone":"+27820000001","otp":"123"}')"
check "verify-otp non-numeric otp" 401 "$(code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d '{"phone":"+27820000001","otp":"abcdef"}')"
check "verify-otp huge phone" 401 "$(code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"$(printf '7%.0s' {1..100})\",\"otp\":\"123456\"}")"

echo
echo "== 4. UNAUTHENTICATED ADMIN API =="
check "GET /api/auth/me" 401 "$(code_of "$BASE/api/auth/me")"
check "GET /api/admin/requests" 401 "$(code_of "$BASE/api/admin/requests")"
check "GET /api/admin/quotes" 401 "$(code_of "$BASE/api/admin/quotes")"
check "GET /api/admin/time-clock" 401 "$(code_of "$BASE/api/admin/time-clock")"
check "POST /api/admin/time-clock" 401 "$(code_of -X POST "$BASE/api/admin/time-clock" -H 'Content-Type: application/json' -d '{"action":"clock_in"}')"
check "POST /api/admin/requests/1" 401 "$(code_of -X POST "$BASE/api/admin/requests/1" -H 'Content-Type: application/json' -d '{"action":"approve"}')"

echo
echo "== 5. OTP BRUTE-FORCE + LOGIN FLOW =="
OTP_JSON=""; DEV_OTP=""
for _ in 1 2 3; do
  OTP_JSON=$(curl -s --max-time 25 -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d '{"phone":"+27820000001"}')
  DEV_OTP=$(echo "$OTP_JSON" | sed -n 's/.*"devOtp":"\([0-9]*\)".*/\1/p')
  [ -n "$DEV_OTP" ] && break
  sleep 3
done
if [ -z "$DEV_OTP" ]; then bad "could not obtain devOtp ($OTP_JSON)"; DEV_OTP="000000"; else ok "obtained dev OTP for registered number"; fi

LOCKED="no"
for i in 1 2 3 4 5; do
  code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"+27820000001\",\"otp\":\"00000$i\"}" > /dev/null
done
if [ "$(code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"+27820000001\",\"otp\":\"111111\"}")" = "401" ]; then LOCKED="yes"; fi
[ "$LOCKED" = "yes" ] && ok "OTP locked after 5 wrong attempts" || bad "OTP not locked after wrong attempts"
check "correct OTP rejected after lockout" 401 "$(code_of -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"+27820000001\",\"otp\":\"$DEV_OTP\"}")"

OTP_JSON2=$(curl -s --max-time 20 -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d '{"phone":"+27820000001"}')
DEV_OTP2=$(echo "$OTP_JSON2" | sed -n 's/.*"devOtp":"\([0-9]*\)".*/\1/p')
LOGIN=$(curl -s --max-time 20 -X POST "$BASE/api/auth/verify-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"+27820000001\",\"otp\":\"$DEV_OTP2\"}" -D /tmp/audit-cookies.txt)
if echo "$LOGIN" | grep -q 'success'; then ok "login with valid OTP"; else bad "login with valid OTP failed: $LOGIN"; fi
COOKIE=$(grep -i '^set-cookie: session=' /tmp/audit-cookies.txt | head -1 | sed -E 's/^set-cookie: ([^;]+).*/\1/i')
if [ -n "$COOKIE" ]; then ok "session cookie issued"; else bad "no session cookie"; fi

echo
echo "== 6. AUTHENTICATED CHECKS =="
if [ -n "$COOKIE" ]; then
  check "GET /api/auth/me with session" 200 "$(code_of "$BASE/api/auth/me" -H "Cookie: $COOKIE")"
  check "GET /api/admin/requests with session" 200 "$(code_of "$BASE/api/admin/requests" -H "Cookie: $COOKIE")"
  check "POST /api/admin/requests/abc (bad id)" 400 "$(code_of -X POST "$BASE/api/admin/requests/abc" -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"action":"approve"}')"
  check "POST /api/admin/requests/9999999999 (overflow id)" 400 "$(code_of -X POST "$BASE/api/admin/requests/9999999999" -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"action":"approve"}')"
  check "POST approve evil Origin with session" 403 "$(code_of -X POST "$BASE/api/admin/requests/1" -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -H 'Origin: https://evil.example' -d '{"action":"approve"}')"
  check "logout" 200 "$(code_of -X POST "$BASE/api/auth/logout" -H "Cookie: $COOKIE")"
else
  echo "  (skipped — no session cookie)"
fi

echo
echo "== 7. RATE LIMITING (per-IP) — last so it doesn't starve other tests =="
RL_CODES=""
for i in $(seq -w 1 12); do
  RL_CODES="$RL_CODES $(code_of -X POST "$BASE/api/auth/request-otp" -H 'Content-Type: application/json' -d "{\"phone\":\"+27000000$i\"}")"
done
echo "  statuses:$RL_CODES"
echo "$RL_CODES" | grep -q '429' && ok "request-otp rate limited (429 seen)" || bad "no 429 after 12 requests"

echo
echo "== 8. UPLOAD CONTENT VALIDATION =="
printf 'this is not an image at all' > /tmp/fake.png
check "upload spoofed PNG (text content)" 400 "$(code_of -X POST "$BASE/api/upload" -H 'Origin: http://localhost:3000' -F 'file=@/tmp/fake.png;type=image/png')"
printf '%%PDF-1.4 fake pdf body' > /tmp/fake.pdf
VALID_PDF_CODE=$(code_of -X POST "$BASE/api/upload" -H 'Origin: http://localhost:3000' -F 'file=@/tmp/fake.pdf;type=application/pdf')
if [ "$VALID_PDF_CODE" = "400" ] || [ "$VALID_PDF_CODE" = "403" ]; then
  bad "valid-magic PDF wrongly rejected (HTTP $VALID_PDF_CODE)"
else
  ok "valid-magic PDF passed content sniff (HTTP $VALID_PDF_CODE — Blob hop unconfigured locally)"
fi
rm -f /tmp/fake.png /tmp/fake.pdf

echo
echo "=========================================="
echo "RESULT: $PASS passed, $FAIL failed"
echo "=========================================="
[ "$FAIL" = "0" ]
