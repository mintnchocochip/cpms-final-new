import mongoose from "mongoose";

const reviewComponentSchema = new mongoose.Schema(
  {
    marks: {
      type: Map,
      of: Number,
      default: {},
    },
    comments: { type: String, default: "" },
    attendance: {
      value: { type: Boolean, default: false },
      locked: { type: Boolean, default: false },
    },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema({
  regNo: String,
  name: String,
  emailId: String,
  reviews: {
    type: Map,
    of: reviewComponentSchema,
    default: {},
  },
  pptApproved: {
    approved: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
  },
  deadline: {
    type: Map,
    of: {
      from: { type: Date },
      to: { type: Date },
    },
    default: {},
  },
  PAT: {
    type: Boolean,
    default: false,
    required: true
  },
  school: String,
  department: String,
});


const Student = mongoose.model("Student", studentSchema);
export default Student;
