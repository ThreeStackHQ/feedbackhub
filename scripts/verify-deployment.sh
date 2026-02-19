#!/bin/bash

# FeedbackHub Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh [production-url]
# Example: ./scripts/verify-deployment.sh https://feedbackhub.threestack.io

set -e

URL="${1:-https://feedbackhub.threestack.io}"
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "FeedbackHub Deployment Verification"
echo "Target: $URL"
echo "========================================="
echo ""

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

test_http() {
  local path=$1
  local description=$2
  local expected_code=${3:-200}
  
  local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$URL$path")
  
  if [ "$response_code" -eq "$expected_code" ]; then
    pass "$description (HTTP $response_code)"
  else
    fail "$description (Expected HTTP $expected_code, got $response_code)"
  fi
}

# Test 1: Homepage loads
echo "1. Testing basic connectivity..."
test_http "/" "Homepage loads"

# Test 2: Login page accessible
echo ""
echo "2. Testing authentication pages..."
test_http "/login" "Login page accessible"
test_http "/signup" "Signup page accessible"

# Test 3: API routes respond
echo ""
echo "3. Testing API endpoints..."
test_http "/api/health" "Health check endpoint" 200

# Test 4: Public routes accessible
echo ""
echo "4. Testing public routes..."
test_http "/pricing" "Pricing page accessible"
test_http "/embed" "Embed page accessible"

# Test 5: Static assets load
echo ""
echo "5. Testing static assets..."
if curl -s -I "$URL/_next/static/css" | grep -q "200\|304"; then
  pass "CSS assets load"
else
  fail "CSS assets not loading"
fi

# Test 6: HTTPS enforcement
echo ""
echo "6. Testing security..."
if curl -s -I "http://feedbackhub.threestack.io" | grep -q "301\|302"; then
  pass "HTTP → HTTPS redirect enforced"
else
  warn "HTTP → HTTPS redirect not detected (may be handled by proxy)"
fi

# Test 7: Response time check
echo ""
echo "7. Testing performance..."
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$URL")
response_time_ms=$(echo "$response_time * 1000" | bc)
if (( $(echo "$response_time < 2.0" | bc -l) )); then
  pass "Homepage response time: ${response_time_ms}ms (< 2000ms)"
else
  fail "Homepage response time: ${response_time_ms}ms (> 2000ms)"
fi

# Test 8: DNS resolution
echo ""
echo "8. Testing DNS..."
if dig +short feedbackhub.threestack.io | grep -q "46.62.246.46"; then
  pass "DNS resolves to correct IP (46.62.246.46)"
else
  fail "DNS not resolving to expected IP"
fi

# Test 9: SSL certificate check
echo ""
echo "9. Testing SSL certificate..."
if echo | openssl s_client -servername feedbackhub.threestack.io -connect feedbackhub.threestack.io:443 2>/dev/null | grep -q "Verify return code: 0"; then
  pass "SSL certificate valid"
else
  warn "SSL certificate check inconclusive (may be proxied by Cloudflare)"
fi

# Summary
echo ""
echo "========================================="
echo "Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All checks passed! Deployment successful.${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some checks failed. Review deployment.${NC}"
  exit 1
fi
