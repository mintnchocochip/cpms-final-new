import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct relative path - go up one level from utils/ to server/
const excelFile = path.resolve(__dirname, '..', 'multi all panels.xlsx');

console.log(`Looking for file at: ${excelFile}`);

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Filter and format the data
  const rawPanels = [];

  data.forEach((row) => {
    const employeeId = row['Panel Employee Id'];
    const facultyName = row['Panel Faculty Name'];
    const cabinDetails = row['Faculty Cabin details '] || row['Faculty Cabin details'];

    if (employeeId && facultyName && cabinDetails) {
      const id = parseInt(employeeId).toString();
      const name = facultyName.trim().replace(/"/g, '\\"');
      const cabin = cabinDetails.trim().replace(/"/g, '\\"');

      rawPanels.push(`  ["${id}", "${name}", "${cabin}"]`);
    }
  });

  // Write output to server/utils directory
  const outputFile = path.join(__dirname, 'panels_data.txt');
  const fileContent = `const rawPanels = [\n${rawPanels.join(',\n')}\n];\n`;

  fs.writeFileSync(outputFile, fileContent, 'utf8');

  console.log(`✓ Extraction complete!`);
  console.log(`✓ Total records extracted: ${rawPanels.length}`);
  console.log(`✓ Output saved to: ${outputFile}`);

} catch (error) {
  console.error('✗ Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure "multi-all-panels.xlsx" is in: D:\\BTECH_CSEcore\\Projects\\pj1\\cpms-final\\');
  console.error('2. Check file name has no typos (including hyphens vs underscores)');
  console.error('3. If file is elsewhere, use absolute path instead');
}
