import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

dotenv.config();

console.log("Mongo URI from env:", process.env.MONGOOSE_CONNECTION_STRING);

// M.Tech 2yrs (1st years)
const rawPanels = [
  [
    ["52193", "Dr. N G Bhuvaneswari Amma"],
    ["53546", "Dr. Thanikachalam V"],
    "AB3 603 11:45AM",
  ],
  [
    ["52194", "Dr. Abishi Chowdhury"],
    ["53552", "Dr. Rolla Subrahmanyam"],
    "AB3 604 11:45AM",
  ],
  [
    ["50616", "Dr. Janaki Meena M"],
    ["53558", "Dr. Prabha B"],
    "AB3 605 11:45AM",
  ],
  [
    ["52200", "Dr. Priyadarshini R"],
    ["53566", "Dr. Sellam V"],
    "AB3 606 11:45AM",
  ],
  [
    ["52208", "Dr. Indra Priyadharshini S"],
    ["53567", "Dr. Shree Prakash"],
    "AB3 607 11:45AM",
  ],
  [
    ["52209", "Dr. D Kavitha"],
    ["53568", "Dr. Softya Sebastian"],
    "AB3 608 11:45AM",
  ],
  [
    ["50094", "Dr. Jegannathan L"],
    ["50384", "Dr. Neela Narayanan V"],
    "AB3 703 11:45AM",
  ],
  [
    ["50186", "Dr. Parvathi R"],
    ["50404", "Dr. Rajiv Vincent"],
    "AB3 704 11:45AM",
  ],
  [
    ["50270", "Dr. Vijayalakshmi A"],
    ["50410", "Dr. Sandhya P"],
    "AB3 705 11:45AM",
  ],
  [
    ["54128", "Dr. Iniya Nehru"],
    ["50390", "Dr. Alok Chauhan"],
    "AB3 706 11:45AM",
  ],
  [
    ["50319", "Dr. Bharadwaja Kumar"],
    ["52882", "Dr. Dhanalakshmi R"],
    "AB3 707 11:45AM",
  ],
  [
    ["50024", "Dr. Pradeep Kumar T.S"],
    ["50391", "Dr. Rabindra Kumar Singh"],
    "AB3 708 11:45AM",
  ],
];

async function createPanels() {
  try {
    await connectDB();

    for (let i = 0; i < rawPanels.length; i++) {
      const [f1, f2, venue] = rawPanels[i];
      const facultyDocs = [];

      // Query faculty documents — get ObjectIds
      for (const [employeeId, name] of [f1, f2]) {
        const faculty = await Faculty.findOne({
          employeeId: employeeId.toString(),
        });
        if (!faculty) {
          console.error(`Faculty NOT found: ${name} (${employeeId})`);
        } else {
          facultyDocs.push(faculty._id);
        }
      }

      if (facultyDocs.length === 2) {
        const newPanel = new Panel({
          members: facultyDocs,
          venue: venue,
          school: "SCOPE",
          department: "M.Tech 2yrs (1st years)",
        });
        await newPanel.save();
        console.log(
          `Created Panel ${i + 1} with members`,
          facultyDocs,
          "Venue:",
          venue
        );
      } else {
        console.error(
          `Panel ${i + 1} creation skipped due to missing faculties`
        );
      }
    }
  } catch (error) {
    console.error("Error creating panels:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

createPanels();
