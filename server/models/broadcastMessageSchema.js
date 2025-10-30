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
    // normalized (lowercase, trimmed) copies of audience for efficient and
    // reliable matching independent of admin-entered casing/spacing
    targetSchoolsNormalized: {
      type: [String],
      default: [],
    },
    targetDepartmentsNormalized: {
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
    // action determines how clients/servers should treat this broadcast
    // 'notice' = informational (default), 'block' = block faculty access
    action: {
      type: String,
      enum: ['notice', 'block'],
      default: 'notice',
    },
  },
  { timestamps: true }
);

broadcastMessageSchema.index({ targetSchools: 1 });
broadcastMessageSchema.index({ targetDepartments: 1 });
broadcastMessageSchema.index({ targetSchoolsNormalized: 1 });
broadcastMessageSchema.index({ targetDepartmentsNormalized: 1 });
broadcastMessageSchema.index({ expiresAt: 1 });
broadcastMessageSchema.index({ createdAt: -1 });

const BroadcastMessage = mongoose.model("BroadcastMessage", broadcastMessageSchema);

export default BroadcastMessage;
