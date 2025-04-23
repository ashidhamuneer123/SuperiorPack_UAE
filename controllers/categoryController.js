import Category from "../models/Category.js";

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
    await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
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
    const image = req.files?.productImages
      ? req.files.productImages.map(file => file.path)
      : undefined;

    const updateData = { name };
    if (image) updateData.image = image;

    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/viewCategories');
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
};

