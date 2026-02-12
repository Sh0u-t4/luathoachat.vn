#!/bin/bash

# ========================================
# QUICK COPY GUIDE - Copy OCR'd files to project
# ========================================

echo "🚀 QUICK COPY GUIDE"
echo "=================================="
echo ""
echo "Sau khi download 2 files .txt từ Google Drive:"
echo ""

# Get project directory
PROJECT_DIR="/tmp/cc-agent/63357473/project"

echo "📁 STEP 1: Copy files từ Downloads"
echo "-----------------------------------"
echo "cd $PROJECT_DIR"
echo ""
echo "# Copy File 1: Luật 69/2025"
echo "cp ~/Downloads/69qh.signed.txt data/legal-documents/extracted-text/69qh_luat_hoa_chat.txt"
echo ""
echo "# Copy File 2: Nghị định 24/2026"
echo "cp ~/Downloads/nghi-dinh-24-2026ndcp.txt data/legal-documents/extracted-text/nghi_dinh_24_2026.txt"
echo ""
echo "# (Thay đổi tên file nếu Google Docs đặt tên khác)"
echo ""

echo "📊 STEP 2: Verify extraction"
echo "-----------------------------------"
echo "npm run verify-extraction"
echo ""

echo "✅ STEP 3: Nếu verify pass (100%), ingest vào database"
echo "-----------------------------------"
echo "npm run ingest-legal-docs"
echo ""

echo "🎉 STEP 4: Build & Deploy"
echo "-----------------------------------"
echo "npm run build"
echo ""

echo "=================================="
echo "💡 TIP: Nếu file name không khớp, chạy:"
echo "    ls -lh ~/Downloads/*.txt"
echo "    để xem tên file chính xác"
echo "=================================="
