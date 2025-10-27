import mongoose from "mongoose";

const broadcastMessageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    targetSchools: {
      type: [String],
      default: [],
    },
    targetDepartments: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    createdByEmployeeId: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

broadcastMessageSchema.index({ targetSchools: 1, targetDepartments: 1 });
broadcastMessageSchema.index({ expiresAt: 1 });
broadcastMessageSchema.index({ createdAt: -1 });

const BroadcastMessage = mongoose.model("BroadcastMessage", broadcastMessageSchema);

export default BroadcastMessage;
