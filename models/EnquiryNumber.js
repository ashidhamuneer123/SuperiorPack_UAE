import mongoose from 'mongoose';

const enquiryNumberSchema = new mongoose.Schema({
  currentNumber: { type: Number, required: true, default: 1000 } // Start at 1000
}, {
  timestamps: true
});

export default mongoose.model('EnquiryNumber', enquiryNumberSchema);
