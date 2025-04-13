
import Category from "../models/Category.js";
import Product from "../models/Product.js"
import User from '../models/User.js';

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
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = 4; // Number of products per page
  try {
  
    const categories = await Category.find()
    const products = await Product.find()
    const users = await User.find()
    res.render("adminDashboard", { categories ,products,users});
  } catch (error) {
    console.error("Error fetching customized product users:", error);
    res.status(500).send("Internal Server Error");
  }
};



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

export const showAddUserPage = async (req, res) => {
  try {
    
    res.render("addUser"); // Pass to view
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};



export const createUser = async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    const user = new User({ userId, name, email });
    await user.save();
    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const viewUsers = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 5;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    res.render("viewUsers", {
      users,
      currentPage,
      totalPages,
      itemsPerPage,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};





export const showEditUserPage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("editUser", { user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    await User.findByIdAndUpdate(id, { name, email });
    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();
    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error("Error toggling user status:", error);
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
      name, moq, description, material,
      function: func, size, leadTime,
      isCustomized, userId, prod_id, catId
    } = req.body;

    const productImages = req.files?.productImages?.map(file => file.path) || [];

    let userRef = null;

    if (isCustomized === "true") {
      const existingUser = await User.findOne({ userId });
      if (!existingUser) {
        return res.send(`<script>alert('User with ID ${userId} does not exist. Please add user first.'); window.history.back();</script>`);
      }
      userRef = existingUser._id;
    }

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
      user: userRef,
      prod_id,
      catId
    });

    await product.save();
    res.redirect('/admin/viewProducts');
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const viewProducts = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = 1; // 1 user per page (showing all their products)
  const skip = (currentPage - 1) * perPage;

  try {
    // Fetch all customized products with user info
    const customizedProducts = await Product.find({
      isCustomized: true,
      user: { $ne: null }
    })
      .populate('user')
      .lean();

    // Group products by userId
    const usersWithCustomizedProducts = [];

    customizedProducts.forEach(product => {
      const user = product.user;
      if (!user) return;

      const existingUser = usersWithCustomizedProducts.find(
        u => u.userId === user.userId
      );

      if (existingUser) {
        existingUser.products.push(product);
      } else {
        usersWithCustomizedProducts.push({
          userId: user.userId,
          userName: user.name,  // User name from schema
          userEmail: user.email,
          status: user.status,
          products: [product]
        });
      }
    });

    // Get the total number of users
    const totalUsers = usersWithCustomizedProducts.length;
    const totalPages = Math.ceil(totalUsers / perPage);

    // Get the user for the current page (slice)
    const userForPage = usersWithCustomizedProducts.slice(skip, skip + perPage);

    // Pass data to the view (single user, pagination info, etc.)
    res.render('viewProducts', {
      userWithProducts: userForPage[0], // Pass the first user of the current page
      currentPage,
      totalPages,
      totalUsers
    });
  } catch (err) {
    res.status(500).send('Failed to load Products');
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


