const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfDirectory = path.join(__dirname, '../data/legal-documents');
const outputDirectory = path.join(pdfDirectory, 'extracted-text');

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

const pdfFiles = [
  {
    input: '69qh.signed.pdf',
    output: '69qh_luat_hoa_chat.txt'
  },
  {
    input: 'nghi-dinh-24-2026ndcp.pdf',
    output: 'nghi_dinh_24_2026.txt',
    forceReextract: true  // File was empty — always re-extract
  },
  {
    input: 'nghi_dinh_so_25.2026.nd-cp_ngay_17.01.2026_ptcn_hoa_chat_anat_hc.pdf',
    output: 'nghi_dinh_25_2026.txt'
  },
  {
    input: 'nghi_dinh_so_26.2026.nd-cp_qlhc_va_hc_nguy_hiem_(1).pdf',
    output: 'nghi_dinh_26_2026.txt'
  }
];

async function extractPDF(inputFile, outputFile, forceReextract = false) {
  try {
    const inputPath = path.join(pdfDirectory, inputFile);
    const outputPath = path.join(outputDirectory, outputFile);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${inputFile}`);
      return false;
    }

    if (!forceReextract && fs.existsSync(outputPath)) {
      console.log(`✅ Already extracted: ${outputFile}`);
      return true;
    }

    if (forceReextract && fs.existsSync(outputPath)) {
      console.log(`🔄 Force re-extracting: ${outputFile} (previous file may have been empty)`);
    } else {
      console.log(`📄 Extracting: ${inputFile}...`);
    }

    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdfParse(dataBuffer);

    const textContent = data.text;

    const lines = textContent.split('\n');
    const numberedLines = lines.map((line, index) => {
      return `${String(index + 1).padStart(6, ' ')}→${line}`;
    }).join('\n');

    fs.writeFileSync(outputPath, numberedLines, 'utf8');

    console.log(`✅ Extracted successfully: ${outputFile}`);
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Characters: ${textContent.length}`);
    return true;
  } catch (error) {
    console.error(`❌ Error extracting ${inputFile}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting PDF extraction process...\n');

  let successCount = 0;
  let failCount = 0;

  for (const file of pdfFiles) {
    const success = await extractPDF(file.input, file.output, file.forceReextract || false);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('📊 Extraction Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Output directory: ${outputDirectory}`);
  console.log('\n🎉 PDF extraction complete!');
}

main().catch(console.error);
