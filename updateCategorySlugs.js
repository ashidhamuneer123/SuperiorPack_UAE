import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import Category from './models/Category.js'; // adjust path as needed

dotenv.config();

async function updateSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const categories = await Category.find();

    for (const category of categories) {
      category.slug = slugify(category.name, { lower: true, strict: true });
      await category.save();
      console.log(`Updated slug for: ${category.name}`);
    }

    console.log('All category slugs updated.');
    process.exit();
  } catch (err) {
    console.error('Error updating slugs:', err);
    process.exit(1);
  }
}

updateSlugs();
