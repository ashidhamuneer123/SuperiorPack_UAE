
import Category from "../models/Category.js";
import Product from "../models/Product.js"


// Admin login page
export const showLoginPage = (req, res) => {
  res.render("adminLogin", { error: null });
};

// Admin login handler
export const handleAdminLogin = (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
      req.session.admin = {
          email: adminEmail,
          loggedIn: true
      };
      return res.redirect('/admin');
  } else {
      return res.render('adminLogin', { error: 'Invalid email or password' });
  }
};


// Admin logout handler
export const handleAdminLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};



// Show admin dashboard
export const showAdminDashboard = async (req, res) => {
  try {
    // Get all customized products
    const customizedProducts = await Product.find({ isCustomized: true });

    // Group customized products by user (if userId exists)
    const usersWithCustomizedProducts = customizedProducts.reduce((acc, product) => {
      if (product.userId) {
        const existingUser = acc.find(u => u.userId.toString() === product.userId.toString());

        if (existingUser) {
          existingUser.products.push(product);
        } else {
          acc.push({
            userId: product.userId,
            userName: product.userName,
            userEmail: product.userEmail,
            products: [product]
          });
        }
      }
      return acc;
    }, []);

    res.render("adminDashboard", { usersWithCustomizedProducts });
  } catch (error) {
    console.error("Error fetching customized product users:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Show category page
export const showAddCategoryPage = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render("addCategory", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const productImages = req.files?.productImages
      ? req.files.productImages.map(file => file.filename)
      : [];

    const category = new Category({
      name,
      image: productImages
    });

    await category.save();
    res.redirect('/admin/addCategory');
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.redirect('/admin/addCategory');
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
    res.redirect('/admin/addCategory');
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
};




// Show product page
export const showAddProductPage =async (req, res) => {
  try {
    const categories = await Category.find(); 
    res.render("addProduct",{ categories });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Internal Server Error");
  }
 
};

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      moq,
      description,
      material,
      function: func,
      size,
      leadTime,
      isCustomized,
      userId,
      userName,
      userEmail,
      prod_id,
      catId
    } = req.body;

    // Get product images uploaded via multer.fields()
    const productImages = req.files?.productImages?.map(file => file.filename) || [];

    const product = new Product({
      name,
      moq,
      description,
      material,
     
      function: func,
      size,
      leadTime,
      image: productImages,
      isCustomized: isCustomized === "true",
      userId: isCustomized === "true" ? userId : null,
      userName: isCustomized === "true" ? userName : null,
      userEmail: isCustomized === "true" ? userEmail : null,
      prod_id,
      catId
    });

    await product.save();
    res.redirect('/admin'); // Adjust this to your admin product listing route if needed
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Internal Server Error");
  }
};






export const blockUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Soft delete by setting a flag
    await Product.updateMany({ userId }, { isCustomized: false });
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Failed to block user');
  }
};


