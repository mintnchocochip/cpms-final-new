import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

dotenv.config();

console.log("Mongo URI from env:", process.env.MONGOOSE_CONNECTION_STRING);

// Two-member panels with venue
const rawPanels = [
  [["52295", "Dr. Joshan Athanesious J"], ["52312", "Dr. Kiruthika"], "AB3 - 103"],
  [["52288", "Dr. Renjith"], ["52281", "Dr. Sivakumar"], "AB3 - 104"],
  [["52275", "Dr Noel Jeygar Robert"], ["53888", "Dr Karthika S K"], "AB3 - 105"],
  [["52264", "Dr. Krithiga R"], ["52283", "Dr. Monica"], "AB3 - 106"],
  [["53647", "Dr. Kshma Trivedi"], ["53637", "Dr. Saranya G"], "AB3 - 107"],
  [["53685", "Dr. Sudha C"], ["53877", "Dr. Umesh K"], "AB3 - 108"],
  [["53695", "Dr. Gayathri Devi S"], ["54173", "Dr. Elakya R"], "AB3 - 109"],
  [["52310", "Dr.Maria anu"], ["51667", "Dr. Leninisha S"], "AB3 - 110"],
  [["54128", "Dr. Iniya Nehru"], ["52285", "Dr. Sandosh S"], "AB3 - 203"],
  [["53674", "Dr. K Uma Maheswari"], ["53661", "Dr. Johanan Joysingh S"], "AB3 - 204"],
  [["53638", "Dr. Omana J"], ["52299", "Dr. Joe Dhanith P R"], "AB3 - 205"],
  [["50237", "Dr. Dr. Saleena B"], ["52279", "Dr. Rama Prabha"], "AB3 - 206"],
  [["52262", "Dr. Mercy Rajaselvi Beaulah P"], ["53558", "Dr. Prabha B"], "AB3 - 207"],
  [["52263", "Dr. Om Kumar C U"], ["53619", "Dr. Manikandan P"], "AB3 - 208"],
  [["52266", "Dr. Suseela S"], ["53623", "Dr. Saranyaraj D"], "AB3 - 209"],
  [["52273", "Dr. S A Amutha Jeevakumari"], ["53624", "Dr. Hemalatha K"], "AB3 - 211"],
  [["52277", "Dr. V Arunkumar"], ["53626", "Dr. Jai Vinita L"], "AB3 - 303"]
];

async function createPanels() {
  try {
    await connectDB();
    console.log("Connected to DB");

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rawPanels.length; i++) {
      const [f1, f2, venue] = rawPanels[i];
      const facultyDocs = [];

      // Query faculty documents — get ObjectIds
      for (const [employeeId, name] of [f1, f2]) {
        const faculty = await Faculty.findOne({
          employeeId: employeeId.toString(),
        });
        if (!faculty) {
          console.error(`✗ Faculty NOT found: ${name} (${employeeId})`);
        } else {
          facultyDocs.push(faculty._id);
        }
      }

      if (facultyDocs.length === 2) {
        const newPanel = new Panel({
          members: facultyDocs,
          venue: venue,
          school: "SCOPE",
          department: "M.Tech Integrated (MIS)",
        });
        await newPanel.save();
        successCount++;
        console.log(
          `✓ Panel ${i + 1} created with ${f1[1]} & ${f2[1]} at ${venue}`
        );
      } else {
        console.error(
          `✗ Panel ${i + 1} creation skipped due to missing faculties`
        );
        failCount++;
      }
    }

    console.log(
      `\n✓ Summary: ${successCount} panels created, ${failCount} failed`
    );
  } catch (error) {
    console.error("Error creating panels:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

createPanels();
