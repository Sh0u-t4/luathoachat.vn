#!/bin/bash

# Test N8N Integration Script
# This script tests the n8n-legal-chat Edge Function

set -e

SUPABASE_URL="https://kahzohzwrypqlakpvhxd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjUxMTQsImV4cCI6MjA4NjUwMTExNH0.2DO_cLFJ4Td5mAsmkFwb3-LTsoybyeAt2eUPvqRPLyA"
N8N_API_KEY="demo_n8n_key_be4ae5ac-04ef-4f2a-a7f2-8b1ac79f9f9f"
ENDPOINT="${SUPABASE_URL}/functions/v1/n8n-legal-chat"

echo "========================================="
echo "🧪 Testing N8N Integration"
echo "========================================="
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "---"
curl -s -X GET "$ENDPOINT" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'
echo ""

# Test 2: Chat with API Key (Header)
echo "📋 Test 2: Chat Request (API Key in Header)"
echo "Query: Hóa chất tiền chất là gì?"
echo "---"
curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $N8N_API_KEY" \
  -d '{
    "action": "chat",
    "query": "Hóa chất tiền chất là gì?",
    "session_id": "test-session-001",
    "top_k": 3
  }' | jq '.'
echo ""

# Test 3: Search Only
echo "📋 Test 3: Search Request (RAG only, no AI)"
echo "Query: giấy phép hóa chất"
echo "---"
curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $N8N_API_KEY" \
  -d '{
    "action": "search",
    "query": "giấy phép hóa chất",
    "top_k": 5
  }' | jq '.data.results[] | {document_code, article_number, similarity, content: (.content | .[0:100])}'
echo ""

# Test 4: Error - Missing API Key
echo "📋 Test 4: Error Test - Missing API Key"
echo "---"
curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "query": "test"
  }' | jq '.'
echo ""

# Test 5: Error - Invalid API Key
echo "📋 Test 5: Error Test - Invalid API Key"
echo "---"
curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid_key_12345" \
  -d '{
    "action": "chat",
    "query": "test"
  }' | jq '.'
echo ""

echo "========================================="
echo "✅ All tests completed"
echo "========================================="
