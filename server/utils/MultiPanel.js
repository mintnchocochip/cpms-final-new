import XLSX from 'xlsx';
import fs from 'fs';

// File path
const panelFile = 'Basic Multidisciplinary Project_Review-II_panel-1.xlsx';

try {
    // Check if file exists
    if (!fs.existsSync(panelFile)) {
        console.error(`❌ File not found: ${panelFile}`);
        process.exit(1);
    }

    console.log(`✅ File found: ${panelFile}`);

    // Read the workbook
    const panelWorkbook = XLSX.readFile(panelFile);
    
    // Check available sheets
    console.log(`📄 Available sheets: ${panelWorkbook.SheetNames.join(', ')}`);
    
    // Try different possible sheet names
    let sheetName = null;
    const possibleNames = ['Panel Details2', 'Panel Details', 'Panel_Details2', 'Panel_Details_2'];
    
    for (const name of possibleNames) {
        if (panelWorkbook.Sheets[name]) {
            sheetName = name;
            break;
        }
    }
    
    if (!sheetName) {
        console.error(`❌ Panel Details sheet not found!`);
        console.log(`Available sheets are: ${panelWorkbook.SheetNames.join(', ')}`);
        process.exit(1);
    }

    console.log(`✅ Using sheet: ${sheetName}`);
    const panelSheet = panelWorkbook.Sheets[sheetName];

    // Convert to JSON
    const panelData = XLSX.utils.sheet_to_json(panelSheet);

    console.log(`📊 Total records in ${sheetName}: ${panelData.length}`);

    if (panelData.length === 0) {
        console.error('❌ No data found in Panel Details sheet!');
        process.exit(1);
    }

    // Show first record for debugging
    console.log(`\n🔍 First record sample:`, panelData[0]);

    // Track last used Panel data for fill-down logic
    let lastPanelEmployeeId = null;
    let lastPanelFacultyName = null;

    // Create output data with Project Name and Panel columns
    const outputData = panelData.map((row, index) => {
        const regNo = row['RegNo'] || '';
        const panelEmployeeId = row['Panel Employee Id'];
        const panelFacultyName = row['Panel Faculty Name'];
        
        // Update last panel data if we found new ones, otherwise use previous ones
        if (panelEmployeeId) {
            lastPanelEmployeeId = panelEmployeeId;
        }
        if (panelFacultyName) {
            lastPanelFacultyName = panelFacultyName;
        }
        
        // Format Panel as "empid Panel_name"
        const panelValue = (lastPanelEmployeeId && lastPanelFacultyName) 
            ? `${lastPanelEmployeeId} ${lastPanelFacultyName}`
            : '';
        
        return {
            'Project Name': `${regNo} (Multi)`,
            'Panel': panelValue
        };
    });
    
    console.log(`\n📋 Processing complete. Creating Excel file...`);
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(outputData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Write to file
    const outputFile = 'Panel_Projects.xlsx';
    XLSX.writeFile(workbook, outputFile);
    
    // Verify file was created
    if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        console.log(`✅ Created: ${outputFile} (${stats.size} bytes)`);
    } else {
        console.error(`❌ Failed to create: ${outputFile}`);
    }

    console.log(`\n🎉 SUCCESS! Created Excel file with ${outputData.length} records.`);
    console.log(`\n📋 Columns:`);
    console.log(`   1. Project Name (RegNo + " (Multi)")`);
    console.log(`   2. Panel (Panel Employee Id + Panel Faculty Name)`);
    console.log(`\n📝 Sample output:`);
    console.log(outputData.slice(0, 3));

} catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
