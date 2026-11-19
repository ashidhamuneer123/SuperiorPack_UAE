import Category from "../models/Category.js";
import slugify from 'slugify';

// Show category page
export const showAddCategoryPage = async (req, res) => {
  try {
    
    res.render("addCategory");
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const productImages = req.files?.productImages
      ? req.files.productImages.map(file => file.path)
      : [];

    const category = new Category({
      name,
      image: productImages
    });

    await category.save();
    res.redirect('/admin/viewCategories');
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const viewCategories = async (req, res) => {

  try {
    const categories = await Category.find({ isDeleted: false });
   res.render('viewCategories',{categories})
  } catch (err) {
    res.status(500).send('Failed to block user');
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.redirect('/admin/viewCategories');

    await Category.updateOne(
      { _id: category._id },
      {
        isDeleted: true,
        slug: `${category.slug}-deleted-${category._id}`, // frees the name for reuse
      }
    );
    res.redirect('/admin/viewCategories');
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Internal Server Error");
  }
};
export const showEditCategoryPage = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.render("editCategory", { category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = { name, slug: slugify(name, { lower: true, strict: true }) };
    if (req.files?.productImages) {
      updateData.image = req.files.productImages.map(file => file.path);
    }

    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/viewCategories');
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === 11000) {
      return res.status(400).send("A category with this name already exists.");
    }
    res.status(500).send("Internal Server Error");
  }
};

// TEMPORARY – remove after running once
export const fixDeletedSlugs = async (req, res) => {
  try {
    const deleted = await Category.find({ isDeleted: true, slug: { $not: /-deleted-/ } });
    for (const c of deleted) {
      await Category.updateOne(
        { _id: c._id },
        { $set: { slug: `${c.slug}-deleted-${c._id}` } }
      );
    }
    res.send(`Fixed ${deleted.length} deleted categories: ${deleted.map(c => c.name).join(', ')}`);
  } catch (error) {
    console.error("Fix slugs error:", error);
    res.status(500).send(error.message);
  }
};
