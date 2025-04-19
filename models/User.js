import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  prodID: { type: String, required: true },
  productImage: { type: String }, // Cloudinary URL
  customizedMOQ: { type: Number },
  size: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }, // new field
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  products: [productSchema] // Embedded products
}, { timestamps: true });

export default mongoose.model('User', userSchema);
