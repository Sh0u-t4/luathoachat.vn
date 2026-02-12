#!/bin/bash

# Script to configure OpenAI API Key in Supabase Edge Functions
# This script helps you add the OPENAI_API_KEY to Supabase secrets

echo "🔐 OpenAI API Key Configuration for Supabase Edge Functions"
echo "=========================================================="
echo ""

# Get the API key from .env file
OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2)

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not found in .env file"
    exit 1
fi

echo "✓ Found OPENAI_API_KEY in .env file"
echo ""

echo "📋 OPTION 1: Add via Supabase Dashboard (RECOMMENDED)"
echo "1. Go to: https://supabase.com/dashboard/project/twdjyaczcxahsqeiwgqn/settings/functions"
echo "2. Scroll to 'Secrets' section"
echo "3. Click 'Add new secret'"
echo "4. Name: OPENAI_API_KEY"
echo "5. Value: $OPENAI_KEY"
echo "6. Click 'Save'"
echo ""

echo "📋 OPTION 2: Add via Supabase CLI"
echo "Run this command:"
echo ""
echo "supabase secrets set OPENAI_API_KEY=\"$OPENAI_KEY\" --project-ref twdjyaczcxahsqeiwgqn"
echo ""

echo "✅ After adding the secret, your Edge Function will have access to OpenAI API"
echo ""
echo "To verify, redeploy your edge function:"
echo "supabase functions deploy legal-ai-chat --project-ref twdjyaczcxahsqeiwgqn"
