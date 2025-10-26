import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  regNo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  emailId: { 
    type: String, 
    required: true 
  },
  reviews: { 
    type: Map, 
    of: Object 
  },
  pptApproved: {
    approved: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
  },
  deadline: { 
    type: Map, 
    of: Object 
  },
  PAT: { 
    type: Boolean, 
    default: false 
  },
  school: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    required: true 
  },
  requiresContribution: { 
    type: Boolean, 
    default: false 
  },
  // ✅ NEW: Added contributionType field
  contributionType: { 
    type: String, 
    enum: ["none", "Patent Filed", "Journal Publication", "Book Chapter Contribution"], 
    default: "none" 
  },
}, {
  timestamps: true // Optional: adds createdAt and updatedAt
});

// Index for faster queries
studentSchema.index({ regNo: 1 });
studentSchema.index({ school: 1, department: 1 });

const Student = mongoose.model("Student", studentSchema);

export default Student;
