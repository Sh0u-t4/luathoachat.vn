#!/bin/bash

# Verify Publish Readiness Script
# Run this before deploying to Netlify

echo "🔍 KIỂM TRA PUBLISH READINESS..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Build exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking Build Output..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".next" ]; then
    echo -e "${GREEN}✅ .next directory exists${NC}"

    # Check required files
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        echo -e "${GREEN}✅ Build ID: $BUILD_ID${NC}"
    else
        echo -e "${RED}❌ BUILD_ID missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

    if [ -f ".next/routes-manifest.json" ]; then
        ROUTES=$(cat .next/routes-manifest.json | grep -c '"page"')
        echo -e "${GREEN}✅ Routes manifest exists${NC}"
    else
        echo -e "${RED}❌ Routes manifest missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

    if [ -d ".next/server" ]; then
        echo -e "${GREEN}✅ Server directory exists${NC}"
    else
        echo -e "${RED}❌ Server directory missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

else
    echo -e "${RED}❌ .next directory not found. Run 'npm run build' first!${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# Check 2: Netlify config
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Checking Netlify Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "netlify.toml" ]; then
    echo -e "${GREEN}✅ netlify.toml exists${NC}"

    # Check build command
    if grep -q "command = \"npm run build\"" netlify.toml; then
        echo -e "${GREEN}✅ Build command: npm run build${NC}"
    else
        echo -e "${YELLOW}⚠️  Build command not standard${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # Check publish directory
    if grep -q 'publish = ".next"' netlify.toml; then
        echo -e "${GREEN}✅ Publish directory: .next${NC}"
    else
        echo -e "${RED}❌ Publish directory incorrect${NC}"
        ERRORS=$((ERRORS+1))
    fi

    # Check plugin
    if grep -q "@netlify/plugin-nextjs" netlify.toml; then
        echo -e "${GREEN}✅ Netlify Next.js plugin configured${NC}"
    else
        echo -e "${RED}❌ Netlify Next.js plugin missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

else
    echo -e "${RED}❌ netlify.toml not found${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# Check 3: Environment variables template
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Checking Environment Variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"

    # Check required vars
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.example; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL defined${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.example; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY defined${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

else
    echo -e "${YELLOW}⚠️  .env.example not found${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check if .env is in gitignore
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore || grep -q "^\.env\.local$" .gitignore; then
        echo -e "${GREEN}✅ .env files ignored in git${NC}"
    else
        echo -e "${YELLOW}⚠️  .env should be in .gitignore${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
fi

echo ""

# Check 4: Next.js config
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Checking Next.js Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✅ next.config.js exists${NC}"

    # Check output mode
    if grep -q "output: 'standalone'" next.config.js; then
        echo -e "${GREEN}✅ Standalone output mode enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Consider adding output: 'standalone' for optimal Netlify deploy${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # Check image optimization
    if grep -q "unoptimized: true" next.config.js; then
        echo -e "${GREEN}✅ Image optimization disabled (good for Netlify)${NC}"
    fi

else
    echo -e "${RED}❌ next.config.js not found${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# Check 5: Dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Checking Dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json exists${NC}"

    # Check for Netlify plugin
    if grep -q "@netlify/plugin-nextjs" package.json; then
        echo -e "${GREEN}✅ @netlify/plugin-nextjs installed${NC}"
    else
        echo -e "${YELLOW}⚠️  @netlify/plugin-nextjs not in dependencies${NC}"
        WARNINGS=$((WARNINGS+1))
    fi

    # Check for Next.js
    if grep -q '"next"' package.json; then
        NEXT_VERSION=$(grep '"next"' package.json | sed 's/.*"next": "\(.*\)".*/\1/')
        echo -e "${GREEN}✅ Next.js version: $NEXT_VERSION${NC}"
    fi

    # Check for Supabase
    if grep -q "@supabase/supabase-js" package.json; then
        echo -e "${GREEN}✅ Supabase client installed${NC}"
    else
        echo -e "${RED}❌ Supabase client missing${NC}"
        ERRORS=$((ERRORS+1))
    fi

else
    echo -e "${RED}❌ package.json not found${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""

# Check 6: Node version
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Checking Node Version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".nvmrc" ]; then
    NVM_VERSION=$(cat .nvmrc)
    echo -e "${GREEN}✅ .nvmrc exists: Node $NVM_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  .nvmrc not found. Consider adding for consistency${NC}"
    WARNINGS=$((WARNINGS+1))
fi

CURRENT_NODE=$(node -v)
echo -e "${GREEN}✅ Current Node: $CURRENT_NODE${NC}"

echo ""

# Final Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ERRORS: $ERRORS${NC}"
else
    echo -e "${RED}❌ ERRORS: $ERRORS${NC}"
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ WARNINGS: $WARNINGS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 READY TO PUBLISH!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "1. Clear Netlify cache (IMPORTANT!)"
    echo "2. Add environment variables to Netlify:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "3. Push to Git:"
    echo "   git add ."
    echo "   git commit -m 'fix: ready for Netlify deployment'"
    echo "   git push origin main"
    echo ""
    echo "📖 See PUBLISH_FIX_SUMMARY.md for detailed instructions"
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${RED}❌ NOT READY TO PUBLISH${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Fix the errors above before deploying."
    echo "Run this script again after fixing."
    exit 1
fi
