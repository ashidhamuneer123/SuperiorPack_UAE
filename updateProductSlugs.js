import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import Product from "./models/Product.js";

dotenv.config();

const updateProductSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const products = await Product.find();

    for (const product of products) {
      const newSlug = slugify(product.name, { lower: true, strict: true });
      if (product.slug !== newSlug) {
        product.slug = newSlug;
        await product.save();
        console.log(`Updated slug for ${product.name} → ${newSlug}`);
      }
    }

    console.log("✅ All product slugs updated");
    process.exit();
  } catch (err) {
    console.error("❌ Error updating slugs", err);
    process.exit(1);
  }
};

updateProductSlugs();
