import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  imageUrl: {
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
    default: undefined, 
  },
  specialization: {
    type: [String],
    required: function () {
      return this.role === "faculty";
    },
    validate: {
      validator: function (val) {
        if (this.role === "admin") {
          return true;
        }
        return arrayLimit(val);
      },
      message: "Faculty must have at least one specialization",
    },
    default: function () {
      return this.role === "admin" ? [] : undefined;
    },
  },
});

function arrayLimit(val) {
  return val.length > 0;
}

const Faculty = mongoose.model("Faculty", facultySchema);

export default Faculty;
