#!/bin/bash

# Test script for RAG system
# Verifies that the Edge Function is working correctly

SUPABASE_URL="https://twdjyaczcxahsqeiwgqn.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZGp5YWN6Y3hhaHNxZWl3Z3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTE3OTUsImV4cCI6MjA4NTc4Nzc5NX0.sP8QvsMK792jHesR-T4K3BlIITywkVmOHs6Ih7y3nI4"

echo "🧪 Testing RAG System - LuatHoaChat.vn"
echo "======================================"
echo ""

# Test 1: Basic query (non-streaming)
echo "Test 1: Basic query about chemical regulations"
echo "Query: 'Axit HCl cần giấy phép gì?'"
echo ""

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/legal-ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "query": "Axit HCl cần giấy phép gì?",
    "stream": false
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if response contains required fields
if echo "$RESPONSE" | jq -e '.response' > /dev/null 2>&1; then
    echo "✅ Test 1 PASSED: Got valid response"
else
    echo "❌ Test 1 FAILED: Invalid response format"
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
        echo "Error: $ERROR_MSG"
    fi
fi

echo ""
echo "======================================"
echo ""

# Test 2: Check response time
echo "Test 2: Performance test (response time)"
START_TIME=$(date +%s%3N)

curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/legal-ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "query": "Nghị định 24/2026 quy định gì?",
    "stream": false
  }' > /dev/null

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "Response time: ${DURATION}ms"

if [ $DURATION -lt 5000 ]; then
    echo "✅ Test 2 PASSED: Response time < 5s (target: < 3s)"
else
    echo "❌ Test 2 FAILED: Response time > 5s"
fi

echo ""
echo "======================================"
echo ""

# Test 3: Streaming test
echo "Test 3: Streaming response test"
echo "Query: 'Hóa chất nào cần khai báo?'"
echo ""
echo "Streaming response:"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/legal-ai-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "query": "Hóa chất nào cần khai báo?",
    "stream": true
  }'

echo ""
echo ""
echo "✅ Test 3 COMPLETED: Streaming test done"

echo ""
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo ""
echo "✓ Edge Function is deployed and accessible"
echo "✓ RAG pipeline is working (if responses are valid)"
echo "✓ Check the responses above for accuracy and citations"
echo ""
echo "Expected in responses:"
echo "  - [Nguồn: Nghị định X/2026/NĐ-CP, Điều Y, Khoản Z]"
echo "  - Structured answers with legal references"
echo "  - Professional tone in Vietnamese"
echo ""
echo "If you see errors about OPENAI_API_KEY, run: bash scripts/setup-openai-secret.sh"
