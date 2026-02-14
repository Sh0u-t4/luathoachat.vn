#!/bin/bash

# Test Rating System - Verification Script
# This script tests the rating API endpoints to ensure they work correctly

set -e

echo "🧪 Testing Rating System..."
echo "================================"
echo ""

# Configuration
API_BASE_URL="${1:-http://localhost:3000}"
TEST_MESSAGE_ID="test-message-$(date +%s)"
TEST_SESSION_ID="test-session-$(date +%s)"

echo "📋 Test Configuration:"
echo "   API Base URL: $API_BASE_URL"
echo "   Test Message ID: $TEST_MESSAGE_ID"
echo "   Test Session ID: $TEST_SESSION_ID"
echo ""

# Test 1: Submit a LIKE rating
echo "Test 1: Submit LIKE rating..."
LIKE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/rate-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"messageId\": \"$TEST_MESSAGE_ID\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"ratingType\": \"like\"
  }")

echo "   Response: $LIKE_RESPONSE"

if echo "$LIKE_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ PASS: LIKE rating submitted successfully"
else
  echo "   ❌ FAIL: LIKE rating submission failed"
  echo "   Response: $LIKE_RESPONSE"
  exit 1
fi
echo ""

# Test 2: Load existing rating
echo "Test 2: Load existing rating..."
GET_RESPONSE=$(curl -s -X GET "$API_BASE_URL/api/rate-message?messageId=$TEST_MESSAGE_ID&sessionId=$TEST_SESSION_ID")

echo "   Response: $GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q '"rating":"like"'; then
  echo "   ✅ PASS: Rating loaded correctly"
else
  echo "   ⚠️  WARNING: Rating might not be loaded correctly"
  echo "   Response: $GET_RESPONSE"
fi
echo ""

# Test 3: Update to DISLIKE rating
echo "Test 3: Update to DISLIKE rating..."
DISLIKE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/rate-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"messageId\": \"$TEST_MESSAGE_ID\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"ratingType\": \"dislike\"
  }")

echo "   Response: $DISLIKE_RESPONSE"

if echo "$DISLIKE_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ PASS: Rating updated to DISLIKE"
else
  echo "   ❌ FAIL: Rating update failed"
  exit 1
fi
echo ""

# Test 4: Verify update
echo "Test 4: Verify rating was updated..."
GET_UPDATED=$(curl -s -X GET "$API_BASE_URL/api/rate-message?messageId=$TEST_MESSAGE_ID&sessionId=$TEST_SESSION_ID")

echo "   Response: $GET_UPDATED"

if echo "$GET_UPDATED" | grep -q '"rating":"dislike"'; then
  echo "   ✅ PASS: Rating updated correctly"
else
  echo "   ⚠️  WARNING: Rating update verification failed"
  echo "   Response: $GET_UPDATED"
fi
echo ""

# Test 5: Delete rating
echo "Test 5: Delete rating..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE_URL/api/rate-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"messageId\": \"$TEST_MESSAGE_ID\",
    \"sessionId\": \"$TEST_SESSION_ID\"
  }")

echo "   Response: $DELETE_RESPONSE"

if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
  echo "   ✅ PASS: Rating deleted successfully"
else
  echo "   ❌ FAIL: Rating deletion failed"
  exit 1
fi
echo ""

# Test 6: Verify deletion
echo "Test 6: Verify rating was deleted..."
GET_DELETED=$(curl -s -X GET "$API_BASE_URL/api/rate-message?messageId=$TEST_MESSAGE_ID&sessionId=$TEST_SESSION_ID")

echo "   Response: $GET_DELETED"

if echo "$GET_DELETED" | grep -q '"rating":null'; then
  echo "   ✅ PASS: Rating deletion verified"
else
  echo "   ⚠️  WARNING: Rating might not be deleted"
  echo "   Response: $GET_DELETED"
fi
echo ""

# Test 7: Invalid rating type
echo "Test 7: Test invalid rating type..."
INVALID_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/rate-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"messageId\": \"$TEST_MESSAGE_ID\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"ratingType\": \"invalid\"
  }")

echo "   Response: $INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q '"error"'; then
  echo "   ✅ PASS: Invalid rating type rejected correctly"
else
  echo "   ⚠️  WARNING: Invalid rating validation might not be working"
fi
echo ""

# Test 8: Missing fields
echo "Test 8: Test missing required fields..."
MISSING_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/rate-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"messageId\": \"$TEST_MESSAGE_ID\"
  }")

echo "   Response: $MISSING_RESPONSE"

if echo "$MISSING_RESPONSE" | grep -q '"error"'; then
  echo "   ✅ PASS: Missing fields rejected correctly"
else
  echo "   ⚠️  WARNING: Field validation might not be working"
fi
echo ""

echo "================================"
echo "✅ All tests completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Check browser console for client-side logs"
echo "   2. Test actual UI by clicking like/dislike buttons"
echo "   3. Verify database stats are updated"
echo "   4. Check admin dashboard displays ratings correctly"
echo ""
echo "📊 Database verification commands:"
echo "   SELECT * FROM message_ratings WHERE message_id::text LIKE 'test-message-%' ORDER BY created_at DESC;"
echo "   SELECT * FROM chat_messages WHERE rating_likes > 0 OR rating_dislikes > 0;"
echo ""
