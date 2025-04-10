// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
