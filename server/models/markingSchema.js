import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true },
  },
  { _id: false }
);

const deadlineSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    reviewName: { type: String, required: true },
    displayName: { type: String }, // Optional display name
    facultyType: { type: String, enum: ["guide", "panel"], required: true }, // ✅ MISSING FIELD
    components: [componentSchema],
    deadline: { type: deadlineSchema, required: true },
    pptApproved: {
      approved: { type: Boolean, default: false },
      locked: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const markingSchema = new mongoose.Schema({
  school: { type: String, required: true },
  department: { type: String, required: true },
  reviews: [reviewSchema],
});

markingSchema.index({ school: 1, department: 1 }, { unique: true });

const MarkingSchemaModel = mongoose.model("MarkingSchema", markingSchema);
export default MarkingSchemaModel;