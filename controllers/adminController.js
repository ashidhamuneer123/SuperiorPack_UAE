import ReOrder from "../models/ReOrder.js";
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
  try {
    // Fetch all users and orders
    const users = await User.find();
    const orders = await ReOrder.find();

    // Fetch top 5 products (sorted by order count, or fallback to recent)
    const products = await Product.find().sort({ createdAt: -1 }).limit(5); 

    // Fetch top 5 categories (sorted by number of products in each, or fallback to name)
    const categories = await Category.find().limit(5);

    // Count for chart data
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const orderCount = await ReOrder.countDocuments();

    res.render("adminDashboard", {
      categories,
      products,
      productCount,
      categoryCount,
      users,
      orders,
      chartData: {
        productCount,
        categoryCount,
        orderCount
      }
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
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
    const { userId, name, email, phone, countryCode} = req.body;

    // Ensure values are arrays even if one input is given
    const prodIDs = Array.isArray(req.body.prodID) ? req.body.prodID : [req.body.prodID];
    const moqs = Array.isArray(req.body.customizedMOQ) ? req.body.customizedMOQ : [req.body.customizedMOQ];
    const sizes = Array.isArray(req.body.size) ? req.body.size : [req.body.size];
    const images = req.files?.customProductImages || [];

    // ✅ Validate all prodIDs exist in the Product collection
    const existingProducts = await Product.find({ prod_id: { $in: prodIDs } });
    const existingProdIDs = existingProducts.map(prod => prod.prod_id);

    const invalidProdIDs = prodIDs.filter(id => !existingProdIDs.includes(id));
    if (invalidProdIDs.length > 0) {
      return res.status(400).send(`Invalid product IDs: ${invalidProdIDs.join(", ")}`);
    }

    // Map valid product data
    const products = prodIDs.map((id, index) => ({
      prodID: id,
      customizedMOQ: moqs[index],
      size: sizes[index],
      productImage: images[index]?.path || "",
      status: 'active'
    }));

    const user = new User({
      userId,
      name,
      email,
      phone: `${countryCode}${phone}`,
      products
    });

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
      .limit(itemsPerPage)
      .lean();

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

export const showAddProductForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const allProducts = await Product.find(); // to show product options

    if (!user) return res.status(404).send("User not found");

    res.render("addProductToUser", {
      user,
      allProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

export const addProductToUser = async (req, res) => {
  try {
    const { prodID, customizedMOQ, size } = req.body;
    const userId = req.params.userId;

    // Get the image URL from cloudinary upload
    const imageFile = req.files?.customProductImages?.[0];
    const productImage = imageFile?.path || '';

    const newProduct = {
      prodID,
      customizedMOQ,
      size,
      productImage,
      status: 'active'
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.products.push(newProduct);
    await user.save();

    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error('Error adding product to user:', error);
    res.status(500).send('Internal Server Error');
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
    const { name, email, phone, countryCode } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).send('User not found');

    user.name = name;
    user.email = email;
    user.phone = `${countryCode}${phone}`; // 👈 Combine country code with number

    await user.save();

    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const deactivateUserProduct = async (req, res) => {
  try {
    const { id, index } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");

    if (user.products && user.products[index]) {
      user.products[index].status = 'inactive';
      await user.save();
    }

    res.redirect('/admin/viewUsers');
  } catch (error) {
    console.error("Error updating product status:", error);
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


export const viewReorders = async (req, res) => {
  try {
    const reorders = await ReOrder.find().populate("customerId");
    res.render("viewOrders", { reorders });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch reorders");
  }
};


