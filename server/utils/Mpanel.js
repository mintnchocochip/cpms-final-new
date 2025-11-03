import XLSX from 'xlsx';
import fs from 'fs';

// File paths
const excelFile = 'Basic Multidisciplinary Project_Review-II_panel-1.xlsx';
const outputFile = 'rawData.js';

try {
    console.log('📊 Reading Excel file...');
    
    // Read the workbook
    const workbook = XLSX.readFile(excelFile);
    
    // Get Panel Details sheet
    const sheetName = 'Panel Details';
    if (!workbook.Sheets[sheetName]) {
        console.error(`❌ Sheet "${sheetName}" not found!`);
        console.log('Available sheets:', workbook.SheetNames.join(', '));
        process.exit(1);
    }
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`✅ Found ${data.length} records in Panel Details sheet`);
    
    // Get unique panels based on Panel Employee Id
    const uniquePanels = [];
    const seenEmpIds = new Set();
    
    data.forEach(row => {
        const empId = row['Panel Employee Id'];
        
        if (empId && !seenEmpIds.has(empId)) {
            seenEmpIds.add(empId);
            
            const panelName = row['Panel Faculty Name'] || '';
            const venue = row['Faculty Cabin details '] || '';
            
            // Convert to string and trim
            const empIdStr = String(empId).trim();
            const panelNameStr = String(panelName).trim();
            const venueStr = String(venue).trim();
            
            uniquePanels.push([empIdStr, panelNameStr, venueStr]);
        }
    });
    
    console.log(`✅ Extracted ${uniquePanels.length} unique panels`);
    
    // Create the JavaScript file content
    const jsContent = `// Auto-generated panel data from Excel
// Format: [['empid'], ['Panel'], ['venue']]

const rawData = [
${uniquePanels.map(panel => `  ['${panel[0]}', '${panel[1]}', '${panel[2]}']`).join(',\n')}
];

export default rawData;
`;
    
    // Write to file
    fs.writeFileSync(outputFile, jsContent, 'utf8');
    
    console.log(`\n🎉 SUCCESS! Created ${outputFile}`);
    console.log(`📊 Total panels: ${uniquePanels.length}`);
    console.log(`\n📋 Sample data (first 5):`);
    uniquePanels.slice(0, 5).forEach((panel, idx) => {
        console.log(`  ${idx + 1}. ${panel[0]} - ${panel[1]} at ${panel[2]}`);
    });
    
    console.log(`\n✅ File created successfully: ${outputFile}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
