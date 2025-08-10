import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  ],
  guideFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  panel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Panel",
    default: null,
  },
  school: { type: String, required: true },
  department: { type: String, required: true },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
