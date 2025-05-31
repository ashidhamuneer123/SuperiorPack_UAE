
import mongoose from 'mongoose';
import slugify from 'slugify';
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true }, // NEW
  image: [String],
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});
// 🔁 Pre-save middleware to auto-generate slug from name
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Category', categorySchema);
