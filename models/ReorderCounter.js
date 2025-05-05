import mongoose from "mongoose";

const ReorderCounterSchema = new mongoose.Schema({
    count: { type: Number, default: 1000 }
  });
  
  export default mongoose.model("ReorderCounter", ReorderCounterSchema);
  