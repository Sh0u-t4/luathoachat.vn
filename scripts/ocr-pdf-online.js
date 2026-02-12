/**
 * OCR SOLUTION FOR SCANNED PDFs
 *
 * This script uses OCR.space's FREE API to extract text from scanned PDFs
 * OCR.space provides 25,000 requests/month for free
 *
 * USAGE:
 * 1. Get free API key from: https://ocr.space/ocrapi
 * 2. Set environment variable: export OCR_API_KEY="your_key_here"
 * 3. Run: node scripts/ocr-pdf-online.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OCR_API_KEY = process.env.OCR_API_KEY || 'K87899142388957'; // Free tier key (limited)
const OCR_API_URL = 'https://api.ocr.space/parse/image';

const pdfDirectory = path.join(__dirname, '../data/legal-documents');
const outputDirectory = path.join(pdfDirectory, 'extracted-text');

// Files that need OCR (scanned image PDFs)
const scannedPDFs = [
  {
    input: '69qh.signed.pdf',
    output: '69qh_luat_hoa_chat.txt',
    description: 'Luật Hóa chất 69/2025/QH15'
  },
  {
    input: 'nghi-dinh-24-2026ndcp.pdf',
    output: 'nghi_dinh_24_2026.txt',
    description: 'Nghị định 24/2026/NĐ-CP'
  }
];

/**
 * Perform OCR on a PDF file using OCR.space API
 */
async function performOCR(pdfPath, outputPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Starting OCR for: ${description}`);
    console.log(`   Input: ${path.basename(pdfPath)}`);

    // Read PDF file as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');

    // Prepare form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="apikey"',
      '',
      OCR_API_KEY,
      `--${boundary}`,
      'Content-Disposition: form-data; name="language"',
      '',
      'eng', // English language (works for Vietnamese too)
      `--${boundary}`,
      'Content-Disposition: form-data; name="isOverlayRequired"',
      '',
      'false',
      `--${boundary}`,
      'Content-Disposition: form-data; name="OCREngine"',
      '',
      '1', // OCR Engine 1 (use 2 for better Asian language support, but 1 is more stable)
      `--${boundary}`,
      'Content-Disposition: form-data; name="scale"',
      '',
      'true',
      `--${boundary}`,
      'Content-Disposition: form-data; name="base64Image"',
      '',
      `data:application/pdf;base64,${base64PDF}`,
      `--${boundary}--`
    ].join('\r\n');

    const options = {
      hostname: 'api.ocr.space',
      path: '/parse/image',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.OCRExitCode === 1 || result.OCRExitCode === 2) {
            // Success
            const extractedText = result.ParsedResults
              .map(page => page.ParsedText)
              .join('\n\n');

            // Format with line numbers
            const lines = extractedText.split('\n');
            const numberedLines = lines.map((line, index) => {
              return `${String(index + 1).padStart(6, ' ')}→${line}`;
            }).join('\n');

            fs.writeFileSync(outputPath, numberedLines, 'utf8');

            console.log(`✅ OCR completed successfully!`);
            console.log(`   Output: ${path.basename(outputPath)}`);
            console.log(`   Characters: ${extractedText.length}`);
            console.log(`   Lines: ${lines.length}`);

            resolve({
              success: true,
              characters: extractedText.length,
              lines: lines.length
            });
          } else {
            // Error
            const errorMsg = result.ErrorMessage || result.ErrorDetails || 'Unknown error';
            console.error(`❌ OCR failed: ${errorMsg}`);
            resolve({ success: false, error: errorMsg });
          }
        } catch (error) {
          console.error(`❌ Failed to parse OCR response: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error: ${error.message}`);
      reject(error);
    });

    // Send request
    req.write(formData);
    req.end();
  });
}

/**
 * Process all scanned PDFs
 */
async function main() {
  console.log('🚀 Starting OCR process for scanned PDFs...');
  console.log(`📁 Input directory: ${pdfDirectory}`);
  console.log(`📁 Output directory: ${outputDirectory}\n`);
  console.log('⚠️  Note: Large PDFs may take several minutes to process\n');

  let successCount = 0;
  let failCount = 0;

  for (const file of scannedPDFs) {
    const inputPath = path.join(pdfDirectory, file.input);
    const outputPath = path.join(outputDirectory, file.output);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${file.input}`);
      failCount++;
      continue;
    }

    // Check file size (OCR.space free tier has limits)
    const stats = fs.statSync(inputPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 5) {
      console.log(`⚠️  File too large (${fileSizeMB.toFixed(2)} MB): ${file.input}`);
      console.log(`   Free API limit is 5 MB. Consider splitting the PDF or using paid tier.`);
      failCount++;
      continue;
    }

    try {
      const result = await performOCR(inputPath, outputPath, file.description);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Wait 3 seconds between requests to avoid rate limiting
      if (scannedPDFs.indexOf(file) < scannedPDFs.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Error processing ${file.input}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 OCR SUMMARY:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\n⚠️  ALTERNATIVE SOLUTIONS FOR FAILED FILES:');
    console.log('1. Use Google Drive OCR (upload PDF → open with Google Docs → download as text)');
    console.log('2. Use Adobe Acrobat Online: https://www.adobe.com/acrobat/online/pdf-to-text.html');
    console.log('3. Request text-based PDF versions from the source');
    console.log('4. Use desktop OCR software (ABBYY FineReader, Adobe Acrobat Pro)');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { performOCR };
