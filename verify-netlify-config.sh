#!/bin/bash

# 🔍 Netlify Configuration Verification Script
# Purpose: Verify all deployment requirements are met

echo "========================================="
echo "🚀 NETLIFY DEPLOYMENT VERIFICATION"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Check 1: Node version
echo "📦 Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Node.js not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 2: .nvmrc file exists
echo "📄 Checking .nvmrc file..."
if [ -f ".nvmrc" ]; then
    NVMRC_VERSION=$(cat .nvmrc)
    echo -e "${GREEN}✅ .nvmrc exists with version: $NVMRC_VERSION${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ .nvmrc file not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 3: netlify.toml exists and has correct config
echo "⚙️  Checking netlify.toml..."
if [ -f "netlify.toml" ]; then
    if grep -q "npm run build" netlify.toml; then
        echo -e "${GREEN}✅ netlify.toml has correct build command${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  netlify.toml exists but build command may be incorrect${NC}"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "${RED}❌ netlify.toml not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 4: next.config.js has standalone output
echo "🔧 Checking next.config.js..."
if [ -f "next.config.js" ]; then
    if grep -q "output.*standalone" next.config.js; then
        echo -e "${GREEN}✅ next.config.js has standalone output mode${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  next.config.js missing 'output: standalone'${NC}"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "${RED}❌ next.config.js not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 5: Environment variables template
echo "🔐 Checking environment variables..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
    PASS=$((PASS + 1))

    # Check for required vars
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.example; then
        echo -e "${GREEN}   ✓ NEXT_PUBLIC_SUPABASE_URL documented${NC}"
    else
        echo -e "${RED}   ✗ Missing NEXT_PUBLIC_SUPABASE_URL${NC}"
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.example; then
        echo -e "${GREEN}   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY documented${NC}"
    else
        echo -e "${RED}   ✗ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    fi
else
    echo -e "${RED}❌ .env.example not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 6: Package.json has correct build script
echo "📦 Checking package.json..."
if [ -f "package.json" ]; then
    if grep -q '"build".*"next build"' package.json; then
        echo -e "${GREEN}✅ package.json has correct build script${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  Build script may be incorrect${NC}"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Check 7: Dependencies installed
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠️  node_modules not found - run 'npm install'${NC}"
    FAIL=$((FAIL + 1))
fi
echo ""

# Summary
echo "========================================="
echo "📊 VERIFICATION SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🚀 Ready to deploy! Next steps:"
    echo "1. Clear Netlify build cache"
    echo "2. Add environment variables to Netlify Dashboard"
    echo "3. Push to Git: git add . && git commit -m 'fix: deployment config' && git push"
    echo ""
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "📖 Please review:"
    echo "- DEPLOYMENT_CHANGES_SUMMARY.md"
    echo "- NETLIFY_DEPLOYMENT_FIX.md"
    echo ""
fi

echo "========================================="
