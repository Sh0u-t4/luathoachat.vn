#!/bin/bash

echo "========================================"
echo "🔍 LUATHOACHAT.VN DEPLOYMENT READINESS"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Build
echo "1️⃣ Checking build status..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build: PASSING${NC}"
else
    echo -e "${RED}❌ Build: FAILED${NC}"
    exit 1
fi

# Check 2: Netlify conflict
echo ""
echo "2️⃣ Checking for deployment conflicts..."
if [ -f "netlify.toml" ]; then
    echo -e "${RED}⚠️  netlify.toml found - WILL CAUSE ERROR${NC}"
    echo "   Fix: mv netlify.toml netlify.toml.disabled"
else
    echo -e "${GREEN}✅ No netlify.toml - OK${NC}"
fi

# Check 3: Next config
echo ""
echo "3️⃣ Checking Next.js config..."
if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✅ next.config.js present${NC}"
else
    echo -e "${RED}❌ next.config.js missing${NC}"
fi

# Check 4: Environment example
echo ""
echo "4️⃣ Checking environment template..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example present${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example missing (optional)${NC}"
fi

# Check 5: Docs
echo ""
echo "5️⃣ Checking deployment docs..."
DOCS_COUNT=0
[ -f "BOLT_CUSTOM_DOMAIN_GUIDE.md" ] && ((DOCS_COUNT++))
[ -f "DEPLOY_TO_LUATHOACHAT_VN.md" ] && ((DOCS_COUNT++))
[ -f "LUATHOACHAT_VN_DEPLOY_SUMMARY.md" ] && ((DOCS_COUNT++))

if [ $DOCS_COUNT -ge 2 ]; then
    echo -e "${GREEN}✅ Deployment docs: $DOCS_COUNT files${NC}"
else
    echo -e "${YELLOW}⚠️  Docs: $DOCS_COUNT files (expected 3+)${NC}"
fi

# Summary
echo ""
echo "========================================"
echo "📊 SUMMARY"
echo "========================================"
echo ""

if [ ! -f "netlify.toml" ]; then
    echo -e "${GREEN}✅ READY TO DEPLOY${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set env variables in Bolt UI"
    echo "2. Click Deploy button"
    echo "3. Add custom domain: luathoachat.vn"
    echo "4. Configure DNS"
    echo ""
    echo "📚 Read: LUATHOACHAT_VN_DEPLOY_SUMMARY.md"
else
    echo -e "${RED}⚠️  ACTION REQUIRED${NC}"
    echo ""
    echo "Run this first:"
    echo "  mv netlify.toml netlify.toml.disabled"
    echo ""
    echo "Then proceed with deployment."
fi

echo "========================================"
