import mongoose from "mongoose";

const ReorderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lpoNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  products: [
    {
      prod_id: String,
      name: String,
      description:String,
      moq: String,
      message: String
    }
  ],
  pdfUrl: { type: String, required: false } // Make it optional
});

export default mongoose.model("Reorder", ReorderSchema);
