import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './db.js';
import Panel from '../models/panelSchema.js';
import Project from '../models/projectSchema.js';
import Faculty from '../models/facultySchema.js';

dotenv.config();

const workbook = XLSX.readFile('/home/administrator/Desktop/excel-files/Upload/MIS_MIA_PANEL.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

async function assignPanelsToProjects() {
  try {
    await connectDB();
    console.log('✓ Connected to DB');

    let successCount = 0;
    let failCount = 0;

    for (const row of data) {
      const projectName = row['Project Name']?.trim();
      const panelInfo = row['Panel']?.trim();

      if (!projectName || !panelInfo) {
        continue;
      }

      // Clean project name
      const cleanProjectName = projectName
        .replace(/[\r\n\x0B]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      try {
        // Extract employee IDs from panel info
        // Format: "52278 Dr. Manjula V & 53627 Dr. Parvathy A K"
        const employeeIds = panelInfo
          .split('&')
          .map(part => {
            const match = part.trim().match(/^(\d+)/);
            return match ? match[1] : null;
          })
          .filter(id => id !== null);

        // Find panel by looking up faculty members
        let panel = null;

        if (employeeIds.length === 2) {
          // Find two faculty members
          const faculty1 = await Faculty.findOne({ employeeId: employeeIds[0] });
          const faculty2 = await Faculty.findOne({ employeeId: employeeIds[1] });

          if (faculty1 && faculty2) {
            // Find panel with these two members
            panel = await Panel.findOne({
              members: {
                $all: [faculty1._id, faculty2._id]
              }
            });
          }
        } else if (employeeIds.length === 1) {
          // Single faculty panel
          const faculty = await Faculty.findOne({ employeeId: employeeIds[0] });
          if (faculty) {
            panel = await Panel.findOne({
              members: faculty._id
            });
          }
        }

        if (!panel) {
          console.error(`✗ Panel NOT found for: ${panelInfo}`);
          failCount++;
          continue;
        }

        // Find and update project
        const project = await Project.findOneAndUpdate(
          { name: { $regex: cleanProjectName, $options: 'i' } },
          { panel: panel._id },
          { new: true }
        );

        if (project) {
          successCount++;
          console.log(`✓ Panel assigned to: ${cleanProjectName}`);
        } else {
          console.error(`✗ Project NOT found: ${cleanProjectName}`);
          failCount++;
        }
      } catch (error) {
        console.error(`✗ Error processing row:`, error.message);
        failCount++;
      }
    }

    console.log(
      `\n✓ Summary: ${successCount} assignments successful, ${failCount} failed`
    );
  } catch (error) {
    console.error('✗ DB Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

assignPanelsToProjects();
