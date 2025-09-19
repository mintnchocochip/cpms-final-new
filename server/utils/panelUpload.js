import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db.js"; // Your DB connection util
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

dotenv.config();

console.log("Mongo URI from env:", process.env.MONGOOSE_CONNECTION_STRING);

// Array of [employeeId, name] as pairs for each panel

//Btech panels
// const rawPanels = [
//   [
//     ["50392", "Dr. Syed Ibrahim S P"],
//     ["52343", "Dr. Dinakaran M"],
//   ],
//   [
//     ["50007", "Dr. Sivagami M"],
//     ["52344", "Dr. Pandiyaraju V"],
//   ],
//   [
//     ["50036", "Dr. Nisha V.M"],
//     ["52346", "Dr. Mary Shamala L"],
//   ],
//   [
//     ["50063", "Dr. Sajidha S A"],
//     ["52349", "Dr. Senthil Kumar A M"],
//   ],
//   [
//     ["53393", "Dr. Natarajan B"],
//     ["52350", "Dr. Asha Jerlin M"],
//   ],
//   [
//     ["50138", "Dr. Vergin Raja Sarobin M"],
//     ["52354", "Dr. Vinothini A"],
//   ],
//   [
//     ["50177", "Dr. Thomas Abraham J V"],
//     ["52361", "Dr. Raja Sree T"],
//   ],
//   [
//     ["50183", "Dr. Ilakiyaselvan N"],
//     ["52610", "Dr. Dominic Savio M"],
//   ],
//   [
//     ["51962", "Dr. Shruti Mishra"],
//     ["52777", "Dr. Sendhil R"],
//   ],
//   [
//     ["50201", "Dr. Umitty Srinivasa Rao"],
//     ["52792", "Dr. Vijayaprabakaran K"],
//   ],
//   [
//     ["51949", "Dr. Suganeshwari G"],
//     ["52799", "Dr. Benil T"],
//   ],
//   [
//     ["50239", "Dr. Khadar Nawas K"],
//     ["52823", "Dr. Ganesh N"],
//   ],
//   [
//     ["50249", "Dr. Prakash B"],
//     ["52825", "Dr. Vatchala S"],
//   ],
//   [
//     ["50250", "Dr. Maheswari S"],
//     ["52833", "Dr. Ilavendhan A"],
//   ],
//   [
//     ["51679", "Dr. Ganala Santoshi"],
//     ["54183", "Dr. Sankari M"],
//   ],
//   [
//     ["50276", "Dr. B V A N S S Prabhakar Rao"],
//     ["52836", "Dr. Vallidevi K"],
//   ],
//   [
//     ["50301", "Dr. Rajkumar S"],
//     ["52851", "Dr. S. Jahangeer Sidiq"],
//   ],
//   [
//     ["50303", "Dr. Malathi G"],
//     ["52859", "Dr. Sobitha Ahila S"],
//   ],
//   [
//     ["50307", "Dr. Priyaadharshini M"],
//     ["52879", "Dr. Rajesh R"],
//   ],
//   [
//     ["50311", "Dr. Kanchana Devi V"],
//     ["52334", "Dr. Sangeetha N"],
//   ],
//   [
//     ["50315", "Dr. Jayaram B"],
//     ["53883", "Dr. Pavithra S"],
//   ],
//   [
//     ["50318", "Dr. Nivedita M"],
//     ["52889", "Dr. A. Pravin Renold"],
//   ],
//   [
//     ["53398", "Dr. Santhi V"],
//     ["53009", "Dr. G. Manju"],
//   ],
//   [
//     ["50322", "Dr. Jayasudha M"],
//     ["53011", "Dr. Deepika Roselind J"],
//   ],
//   [
//     ["50352", "Dr. Jenila Livingston L M"],
//     ["52227", "Dr. Sherly Alphonse"],
//   ],
//   [
//     ["50359", "Dr. Rekha D"],
//     ["52232", "Dr. Abinaya S"],
//   ],
//   [
//     ["50370", "Dr. Rajesh Kumar"],
//     ["53025", "Dr. Palani Thanaraj K"],
//   ],
//   [
//     ["50378", "Dr. Umamaheswari E"],
//     ["53027", "Dr. Sudheer Kumar E"],
//   ],
//   [
//     ["50380", "Dr. Rajarajeswari S"],
//     ["53029", "Dr. Kanimozhi S"],
//   ],
//   [
//     ["54146", "Dr. Poornima S"],
//     ["53030", "Dr. Deepa Nivethika S"],
//   ],
//   [
//     ["50386", "Dr. Abdul Quadir Md"],
//     ["53034", "Dr. Elakiya E"],
//   ],
//   [
//     ["54147", "Dr. S Vigneshwari"],
//     ["53035", "Dr. Christopher Columbus C"],
//   ],
//   [
//     ["52335", "Dr. Amutha S"],
//     ["52342", "Dr. Saraswathi D"],
//   ],
//   [
//     ["52337", "Dr. Anandan P"],
//     ["53037", "Dr. Leki Chom Thungon"],
//   ],
//   [
//     ["50396", "Dr. Pradeep K V"],
//     ["53039", "Dr. Suvidha Rupesh Kumar"],
//   ],
//   [
//     ["50398", "Dr. Sivabalakrishnan M"],
//     ["53046", "Dr. Srisakthi Saravanan"],
//   ],
//   [
//     ["51948", "Dr. Sudha A"],
//     ["53048", "Dr. M. Malini Deepika"],
//   ],
//   [
//     ["50401", "Dr. Punitha K"],
//     ["53049", "Dr. Revathi A R"],
//   ],
//   [
//     ["50403", "Dr. Rajesh M"],
//     ["53050", "Dr. Sandhya M"],
//   ],
//   [
//     ["53060", "Dr. Anubha Pearline S"],
//     ["54149", "Dr. Sujatha M"],
//   ],
//   [
//     ["52338", "Dr. D Jeya Mala"],
//     ["53063", "Dr. Rathna R"],
//   ],
//   [
//     ["50926", "Dr. Jayanthi R"],
//     ["53069", "Dr. Afruza Begum"],
//   ],
//   [
//     ["50422", "Dr. Priyadarshini J"],
//     ["53073", "Dr. Senthil Prakash P N"],
//   ],
//   [
//     ["50430", "Dr. R. Prabhakaran"],
//     ["53074", "Dr. Sudharson S"],
//   ],
//   [
//     ["50432", "Dr. Shola Usha Rani"],
//     ["53075", "Dr. Kaja Mohideen A"],
//   ],
//   [
//     ["52341", "Dr. Praveen Joe I R"],
//     ["53076", "Dr. V. Karthika"],
//   ],
//   [
//     ["50569", "Dr. Subbulakshmi T"],
//     ["53077", "Dr. Lakshmi Harika Palivela"],
//   ],
//   [
//     ["50577", "Dr. Renta Chintala Bhargavi"],
//     ["53078", "Dr. V. Premanand"],
//   ],
//   [
//     ["52239", "Dr. Padmavathy T V"],
//     ["53091", "Dr. Rajakumar R"],
//   ],
//   [
//     ["52261", "Dr. Bhavadharini R M"],
//     ["53093", "Dr. Aravindkumar S"],
//   ],
//   [
//     ["52333", "Dr. Janani T"],
//     ["53101", "Dr. Avuthu Avinash Reddy"],
//   ],
//   [
//     ["51142", "Dr. Jani Anbarasi L"],
//     ["53102", "Dr. Nathezhtha T"],
//   ],
//   [
//     ["51325", "Dr. M. Prasad"],
//     ["53103", "Dr. Padmanaban R"],
//   ],
//   [
//     ["51327", "Dr. M. Braveen"],
//     ["53104", "Dr. Raja M"],
//   ],
//   [
//     ["51328", "Dr. V. Muthumanikandan"],
//     ["53105", "Dr. Balasaraswathi V R"],
//   ],
//   [
//     ["51329", "Dr. A. K Ilavarasi"],
//     ["53112", "Dr. Karthikeyan N"],
//   ],
//   [
//     ["51339", "Dr. SK Ayesha"],
//     ["53124", "Dr. Subitha D"],
//   ],
//   [
//     ["51344", "Dr. Radhika Selvamani"],
//     ["53125", "Dr. Kanthimathi S"],
//   ],
//   [
//     ["51347", "Dr. Bhuvaneswari A"],
//     ["53126", "Dr. Kabilan K"],
//   ],
//   [
//     ["51457", "Dr. Manas Ranjan Prusty"],
//     ["53127", "Dr. Kavitha J C"],
//   ],
//   [
//     ["51458", "Dr. R Jothi"],
//     ["53128", "Dr. Sivakami R"],
//   ],
//   [
//     ["51651", "Dr. K Muthukumaran"],
//     ["53134", "Dr. Valarmathi K"],
//   ],
//   [
//     ["51652", "Dr. S Venkatraman"],
//     ["53136", "Dr. Sridevi S"],
//   ],
//   [
//     ["51654", "Dr. Ashoka Rajan R"],
//     ["53137", "Dr. Dhavakumar P"],
//   ],
//   [
//     ["52192", "Dr. Valarmathi Sudhakar"],
//     ["53139", "Dr. Indira B"],
//   ],
//   [
//     ["53608", "Dr. Benila S"],
//     ["53145", "Dr. Vignesh U"],
//   ],
//   [
//     ["51658", "Dr. Parkavi K"],
//     ["53153", "Dr. Kishor Kisan Ingle"],
//   ],
//   [
//     ["51659", "Dr. Shivani Gupta"],
//     ["53154", "Dr. Rama Parvathy L"],
//   ],
//   [
//     ["51662", "Dr. X Anita"],
//     ["53157", "Dr. P. Saravanan"],
//   ],
//   [
//     ["51663", "Dr. P Subbulakshmi"],
//     ["53159", "Dr. Renuka Devi R"],
//   ],
//   [
//     ["51665", "Dr. Amrit Pal"],
//     ["53160", "Dr. Poonkodi M"],
//   ],
//   [
//     ["51667", "Dr. Leninisha Shanmugam"],
//     ["53161", "Dr. Prem Sankar N"],
//   ],
//   [
//     ["51669", "Dr. A Swaminathan"],
//     ["53164", "Dr. A. B. Ahadit"],
//   ],
//   [
//     ["51672", "Dr. Rishikeshan C A"],
//     ["53166", "Dr. Marimuthu M"],
//   ],
//   [
//     ["51657", "Dr. Pavithra L K"],
//     ["53343", "Dr. Lekshmi K"],
//   ],
//   [
//     ["51682", "Dr. Prakash P"],
//     ["53368", "Dr. Logeswari G"],
//   ],
//   [
//     ["51743", "Dr. K P Vijayakumar"],
//     ["53376", "Dr. Nivethitha V"],
//   ],
//   [
//     ["51748", "Dr. K Pradeep"],
//     ["53382", "Dr. Sreeja P S"],
//   ],
//   [
//     ["51754", "Dr. Radha R"],
//     ["53387", "Dr. Anita Christaline J"],
//   ],
//   [
//     ["51946", "Dr. T Kalaipriyan"],
//     ["53388", "Dr. Kavipriya G"],
//   ],
//   [
//     ["51947", "Dr. Rajakumar Arul"],
//     ["53391", "Dr. Selvam D"],
//   ],
//   [
//     ["53017", "Dr. Jannath Nisha O S"],
//     ["53598", "Dr. Tahir Mujtaba"],
//   ],
//   [
//     ["53019", "Dr. V. Brindha"],
//     ["53601", "Dr. P. Sankar"],
//   ],
//   [
//     ["52245", "Dr. Sahaya Beni Prathiba B"],
//     ["53609", "Dr. Sivaramakrishnan N"],
//   ],
//   [
//     ["52247", "Dr. Tamilarasi K"],
//     ["53408", "Dr. Padma J"],
//   ],
//   [
//     ["52250", "Dr. Trilok Nath Pandey"],
//     ["53615", "Dr. Balraj E"],
//   ],
//   [
//     ["52255", "Dr. Abirami S"],
//     ["53616", "Dr. Helen Vijitha P"],
//   ],
//   [
//     ["52256", "Dr. Sathian D"],
//     ["53617", "Dr. Devi K"],
//   ],
//   [
//     ["54151", "Dr. Aarthi B"],
//     ["53618", "Dr. Sakthivel R"],
//   ],
// ];

//MCA Panels
const rawPanels = [
  [
    ["52262", "Dr. Mercy Rajaselvi Beaulah P"],
    ["53619", "Dr. Manikandan P"],
    "AB3-607 Classroom",
  ],
  [
    ["52263", "Dr. Om Kumar C U"],
    ["53623", "Dr. Saranyaraj D"],
    "AB3-608 Classroom",
  ],
  [
    ["52264", "Dr. Krithiga R"],
    ["53624", "Dr. Hemalatha K"],
    "AB3-609 Classroom",
  ],
  [
    ["52266", "Dr. Suseela S"],
    ["53626", "Dr. Jai Vinitha L"],
    "AB3-612 Classroom",
  ],
  [
    ["52273", "Dr. S A Amutha Jeevakumari"],
    ["53627", "Dr. Parvathy A K"],
    "AB3-703 Classroom",
  ],
  [
    ["52275", "Dr. Noel Jeygar Robert V"],
    ["53629", "Dr. Jeipratha P N"],
    "AB3-704 Classroom",
  ],
  [
    ["52277", "Dr. V Arunkumar"],
    ["53630", "Dr. Sambath M"],
    "AB3-705 Classroom",
  ],
  [
    ["52278", "Dr. Manjula V"],
    ["53633", "Dr. Ranjith Kumar M"],
    "AB3-706 Classroom",
  ],
  [
    ["52279", "Dr. Rama Prabha K P"],
    ["53637", "Dr. Saranya G"],
    "AB3-707 Classroom",
  ],
  [
    ["50879", "Dr. Rajalakshmi R"],
    ["53638", "Dr. Omana J"],
    "AB3-708 Classroom",
  ],
  [
    ["52281", "Dr. Sivakumar P"],
    ["53641", "Dr. Vidhya Lakshmi M"],
    "AB3-709 Classroom",
  ],
  [
    ["52283", "Dr. Monica K M"],
    ["53642", "Dr. Sarita Kumari"],
    "AB3-713 Classroom",
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
          facultyDocs.push(faculty._id); // Store ObjectId reference here
        }
      }

      if (facultyDocs.length === 2) {
        const newPanel = new Panel({
          members: facultyDocs, // Assign ObjectId array here for relation
          venue: venue,
          school: "SCOPE",
          department: "MCA",
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