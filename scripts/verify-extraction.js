/**
 * VERIFICATION SCRIPT FOR EXTRACTED TEXT FILES
 *
 * This script verifies that all 4 legal documents have been extracted correctly
 * and provides detailed analysis of the extraction quality.
 */

const fs = require('fs');
const path = require('path');

const extractedDir = path.join(__dirname, '../data/legal-documents/extracted-text');

// Expected files with minimum size requirements (in bytes)
const expectedFiles = [
  {
    filename: '69qh_luat_hoa_chat.txt',
    minSize: 80 * 1024, // 80 KB minimum
    description: 'Luật Hóa chất 69/2025/QH15',
    expectedPages: 29
  },
  {
    filename: 'nghi_dinh_24_2026.txt',
    minSize: 150 * 1024, // 150 KB minimum
    description: 'Nghị định 24/2026/NĐ-CP',
    expectedPages: 88
  },
  {
    filename: 'nghi_dinh_25_2026.txt',
    minSize: 100 * 1024, // 100 KB minimum
    description: 'Nghị định 25/2026/NĐ-CP',
    expectedPages: 38
  },
  {
    filename: 'nghi_dinh_26_2026.txt',
    minSize: 120 * 1024, // 120 KB minimum
    description: 'Nghị định 26/2026/NĐ-CP',
    expectedPages: 43
  }
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeTextQuality(content, description) {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const avgLineLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length;

  // Check for common OCR issues
  const hasVietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(content);
  const hasLegalTerms = /điều|khoản|nghị định|luật|quy định|chính phủ/i.test(content);

  // Check if it's just page numbers (bad OCR)
  const numberOnlyLines = nonEmptyLines.filter(line => /^\d+$/.test(line.trim()));
  const numberOnlyRatio = numberOnlyLines.length / nonEmptyLines.length;

  return {
    totalLines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    avgLineLength: Math.round(avgLineLength),
    hasVietnameseChars,
    hasLegalTerms,
    isOnlyPageNumbers: numberOnlyRatio > 0.8,
    quality: numberOnlyRatio > 0.8 ? 'BAD (Only page numbers)' :
             avgLineLength < 20 ? 'POOR (Lines too short)' :
             !hasVietnameseChars ? 'MEDIUM (No Vietnamese characters)' :
             hasLegalTerms ? 'EXCELLENT' : 'GOOD'
  };
}

console.log('🔍 VERIFYING EXTRACTED TEXT FILES...\n');
console.log('=' .repeat(70));

let totalFiles = 0;
let validFiles = 0;
let issues = [];

for (const fileInfo of expectedFiles) {
  const filePath = path.join(extractedDir, fileInfo.filename);
  totalFiles++;

  console.log(`\n📄 ${fileInfo.description}`);
  console.log(`   File: ${fileInfo.filename}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ STATUS: FILE NOT FOUND`);
    issues.push(`${fileInfo.filename}: File not found`);
    continue;
  }

  // Check file size
  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  const fileSizeFormatted = formatBytes(fileSizeBytes);

  console.log(`   📊 Size: ${fileSizeFormatted}`);

  if (fileSizeBytes < fileInfo.minSize) {
    const minSizeFormatted = formatBytes(fileInfo.minSize);
    console.log(`   ⚠️  WARNING: File too small (minimum: ${minSizeFormatted})`);
    issues.push(`${fileInfo.filename}: Too small (${fileSizeFormatted} < ${minSizeFormatted})`);
  }

  // Analyze content quality
  const content = fs.readFileSync(filePath, 'utf8');
  const analysis = analyzeTextQuality(content, fileInfo.description);

  console.log(`   📝 Lines: ${analysis.totalLines} (non-empty: ${analysis.nonEmptyLines})`);
  console.log(`   📏 Avg line length: ${analysis.avgLineLength} characters`);
  console.log(`   🇻🇳 Vietnamese: ${analysis.hasVietnameseChars ? '✅' : '❌'}`);
  console.log(`   ⚖️  Legal terms: ${analysis.hasLegalTerms ? '✅' : '❌'}`);
  console.log(`   ⭐ Quality: ${analysis.quality}`);

  // Determine if file is valid
  const isValid = fileSizeBytes >= fileInfo.minSize &&
                  analysis.quality !== 'BAD (Only page numbers)' &&
                  !analysis.isOnlyPageNumbers;

  if (isValid) {
    console.log(`   ✅ STATUS: VALID`);
    validFiles++;
  } else {
    console.log(`   ❌ STATUS: INVALID - Needs re-extraction`);
    if (analysis.isOnlyPageNumbers) {
      issues.push(`${fileInfo.filename}: Only contains page numbers (needs OCR)`);
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log(`\n📊 SUMMARY:`);
console.log(`   Valid files: ${validFiles}/${totalFiles}`);
console.log(`   Completion: ${Math.round((validFiles/totalFiles) * 100)}%`);

if (issues.length > 0) {
  console.log(`\n⚠️  ISSUES FOUND (${issues.length}):`);
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

if (validFiles === totalFiles) {
  console.log('\n✅ ALL FILES VALIDATED SUCCESSFULLY!');
  console.log('   Ready to run: npm run ingest-legal-docs');
  process.exit(0);
} else {
  console.log('\n❌ SOME FILES NEED ATTENTION');
  console.log('   Please check the issues above and re-extract problematic files.');
  console.log('\n📖 For OCR instructions, see: OCR_FINAL_SOLUTION.md');
  process.exit(1);
}
