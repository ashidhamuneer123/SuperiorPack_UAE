import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  moq:{ type: String, required: true },
  description: { type: String, required: true },
  material: { type: String, required: true },
 
  function: { type: String, required: true },
  size: { type: String, required: true },
  leadTime: { type: String, required: true },
  image: [String], // Store as array of filenames
  isCustomized: { type: Boolean, default: false },
  userId: { type: String },
  userName: String,
  userEmail: String,
  prod_id: { type: String, required: true }, // Customized product ID
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Reference to Category
  timestamp: { type: Date, default: Date.now }, // Timestamp of when the product is added
});

export default mongoose.model('Product', productSchema);
