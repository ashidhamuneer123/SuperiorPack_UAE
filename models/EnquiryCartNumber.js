// models/EnquiryCartNumber.js
import mongoose from 'mongoose';

const enquiryCartNumberSchema = new mongoose.Schema({
  currentNumber: {
    type: Number,
    required: true,
    default: 1, // This will result in EC0001 as the first
  },
}, { timestamps: true });

export default mongoose.model('EnquiryCartNumber', enquiryCartNumberSchema);
