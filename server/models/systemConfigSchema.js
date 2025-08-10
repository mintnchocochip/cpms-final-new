import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const systemConfigSchema = new mongoose.Schema({
  draftReview: { type: deadlineSchema, required: true },
  review0: { type: deadlineSchema, required: true },
  review1: { type: deadlineSchema, required: true },
  review2: { type: deadlineSchema, required: true },
  review3: { type: deadlineSchema, required: true },
  review4: { type: deadlineSchema, required: true }, // Added
  pptApproved: { type: deadlineSchema, required: true },
});

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);
export default SystemConfig;
