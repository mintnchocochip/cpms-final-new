import mongoose from "mongoose";

const panelSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
  ],
  venue: {
    type: String,
    required: false, // Not required as specified
  },
  school: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
});

const Panel = mongoose.model("Panel", panelSchema);
export default Panel;
