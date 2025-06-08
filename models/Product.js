import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true }, // NEW FIELD
  moq: { type: String, required: true },
  description: { type: String, required: true },
  material: { type: String, required: true },
  function: { type: String, required: true },
  size: { type: String, required: true },
  leadTime: { type: String, required: true },
  image: [String],
  isCustomized: { type: Boolean, default: false },
  prod_id: { type: String, required: true },
  catId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  printing: { type: String },
  ingredients: { type: String },
  minOrderWithPrinting: { type: String },
  minOrderWithoutPrinting: { type: String },
  moreInfo: { type: String },
  customSizes: [{
    size: { type: String },
    systemCode: { type: String }
  }]
}, {
  timestamps: true
});

// 🔁 Auto-generate slug from name on save
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Product", productSchema);
