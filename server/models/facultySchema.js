import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  imageUrl: {
    // the image has to be hosted on some cloud service and the url should be stored here, its on vit
    type: String,
    default: "",
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
    match: [/^[A-Za-z0-9]+$/, "Please enter a valid employee ID"],
  },
  name: {
    type: String,
    required: true,
  },
  emailId: {
    type: String,
    unique: true,
    required: true,
    match: [/.+@vit\.ac\.in$/, "Please enter a valid VIT email address"],
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "faculty"],
    required: true,
  },
  school: {
    type: [String],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least one school"],
  },
  department: {
    type: [String],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least one department"],
  },
  specialization: {
    type: [String],
    required: true,
    validate: [arrayLimit, "{PATH} must have at least one specialization"],
  },
});

function arrayLimit(val) {
  return val.length > 0;
}

const Faculty =  mongoose.model("Faculty", facultySchema);

export default Faculty;
