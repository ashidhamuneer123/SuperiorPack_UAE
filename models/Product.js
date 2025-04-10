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
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  prod_id: { type: String, required: true },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
