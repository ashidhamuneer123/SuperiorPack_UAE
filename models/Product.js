import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  moq: { type: String, required: true },
  description: { type: String, required: true },
  material: { type: String, required: true },
  function: { type: String, required: true },
  size: { type: String, required: true },
  leadTime: { type: String, required: true },
  image: [String],
  isCustomized: { type: Boolean, default: false },
  prod_id: { type: String, required: true },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  printing: { type: String },
  ingredients: { type: String },
  minOrderWithPrinting: { type: String },
  minOrderWithoutPrinting: { type: String },
  quality: { type: String },
  color: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
