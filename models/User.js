import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    moq: { type: Number, required: true },
    image: { type: String } // Store image filename or URL
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    products: [ProductSchema] // Store an array of products
});

export default mongoose.model("User", UserSchema);
