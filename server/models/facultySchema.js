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
    required: function() {
      return this.role === 'faculty'; // Only required if role is faculty
    },
    validate: {
      validator: function(val) {
        // If role is admin, specialization can be empty
        if (this.role === 'admin') {
          return true;
        }
        // If role is faculty, must have at least one specialization
        return arrayLimit(val);
      },
      message: "Faculty must have at least one specialization"
    },
    default: function() {
      // Default to empty array for admins, or require input for faculty
      return this.role === 'admin' ? [] : undefined;
    }
  },
});

function arrayLimit(val) {
  return val.length > 0;
}

const Faculty = mongoose.model("Faculty", facultySchema);

export default Faculty;
