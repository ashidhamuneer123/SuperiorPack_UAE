// models/Enquiry.js
import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  products: [{
    prod_id: String,
    name: String,
    moq: String,
    size: String,
    message: String
  }],
  customer: {
    name: String,
    email: String,
    phone: String,
    additionalMessage: String
  },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Enquiry', enquirySchema);
