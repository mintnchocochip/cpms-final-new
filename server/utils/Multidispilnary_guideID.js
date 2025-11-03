import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// File path - make sure to include .xlsx extension
const guideFile = 'Basic Multidisciplinary Project_Review-II _ panel-2.xlsx';

try {
    // Check if file exists
    if (!fs.existsSync(guideFile)) {
        console.error(`❌ File not found: ${guideFile}`);
        console.log(`📁 Current directory: ${process.cwd()}`);
        console.log(`📋 Files in current directory:`);
        fs.readdirSync('.').forEach(file => console.log(`   - ${file}`));
        process.exit(1);
    }

    console.log(`✅ File found: ${guideFile}`);

    // Read the workbook
    const guideWorkbook = XLSX.readFile(guideFile);
    
    // Check available sheets
    console.log(`📄 Available sheets: ${guideWorkbook.SheetNames.join(', ')}`);
    
    // Check if Guide Details_2_2 sheet exists
    if (!guideWorkbook.Sheets['Guide Details_2']) {
        console.error(`❌ Sheet 'Guide Details_2' not found!`);
        console.log(`Available sheets are: ${guideWorkbook.SheetNames.join(', ')}`);
        process.exit(1);
    }

    const guideSheet = guideWorkbook.Sheets['Guide Details_2'];

    // Convert to JSON
    const guideData = XLSX.utils.sheet_to_json(guideSheet);

    console.log(`📊 Total records in Guide Details_2: ${guideData.length}`);

    if (guideData.length === 0) {
        console.error('❌ No data found in Guide Details_2 sheet!');
        process.exit(1);
    }

    // Show first record for debugging
    console.log(`\n🔍 First record sample:`, guideData[0]);

    // Calculate number of sheets needed (150 records per sheet)
    const recordsPerSheet = 150;
    const numSheets = Math.ceil(guideData.length / recordsPerSheet);

    console.log(`\n📄 Creating ${numSheets} Excel sheets with ${recordsPerSheet} records each...\n`);

    // Track last used Guide ID for fill-down logic
    let lastGuideId = null;

    // Create Excel files
    for (let sheetNum = 0; sheetNum < numSheets; sheetNum++) {
        const startIdx = sheetNum * recordsPerSheet;
        const endIdx = Math.min((sheetNum + 1) * recordsPerSheet, guideData.length);
        const sheetData = guideData.slice(startIdx, endIdx);
        
        console.log(`📋 Processing Sheet ${sheetNum + 1}: Records ${startIdx + 1} to ${endIdx} (${sheetData.length} records)`);
        
        // Create output data with specified columns
        const outputData = sheetData.map(row => {
            const regNo = row['RegNo'] || '';
            const guideId = row['Guide employ id'];
            
            // Update lastGuideId if we found a new one, otherwise use the previous one
            if (guideId) {
                lastGuideId = guideId;
            }
            
            return {
                'Project Name': `${regNo} (Multi)`,
                'Guide Faculty Employee ID': lastGuideId || '',
                'School': 'SCOPE',
                'Department': 'Multidisciplinary',
                'Specialization': 'general',
                'Type': 'Software',
                'Student Name 1': row['Name'] || '',
                'Student RegNo 1': `${regNo} (Multi)`,
                'Student Email 1': row['Mail'] || '',
                'Student Name 2': '',
                'Student RegNo 2': '',
                'Student Email 2':'',
                'Student Name 3': '',
                'Student RegNo 3': '',
                'Student Email 3': ''
            };
        });
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(outputData);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        
        // Write to file
        const outputFile = `Basic_review2_proj${sheetNum + 1}.xlsx`;
        XLSX.writeFile(workbook, outputFile);
        
        // Verify file was created
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`✅ Created: ${outputFile} (${stats.size} bytes)`);
        } else {
            console.error(`❌ Failed to create: ${outputFile}`);
        }
    }

    console.log(`\n🎉 SUCCESS! Created ${numSheets} Excel files.`);
    console.log('\n📝 Summary:');
    console.log(`   - Files created: Basic_review2_proj1.xlsx to Basic_review2_proj${numSheets}.xlsx`);
    console.log(`   - Records per file: ${recordsPerSheet} (except last file)`);
    console.log(`   - Total records processed: ${guideData.length}`);
    console.log(`\n📋 Files in current directory after creation:`);
    fs.readdirSync('.').filter(f => f.endsWith('.xlsx')).forEach(file => {
        console.log(`   - ${file}`);
    });

} catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
