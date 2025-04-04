import User from "../models/User.js";



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
    const users = await User.find();
    res.render("adminDashboard", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};
// Show add user page
export const showAddUserPage = (req, res) => {
  res.render("addUser");
};


// Add user with multiple products
export const addUser = async (req, res) => {
  try {
    const { username, email, products, moqs } = req.body;  // Getting data from the form
    const files = req.files['productImages'];  // Correct way to access product images

    if (!files || files.length === 0) {
      return res.status(400).send("No product images uploaded.");
    }

    // Ensure product names and moqs are properly mapped
    const productData = products.map((productName, index) => {
      return {
        name: productName,
        moq: moqs[index] || 0,  // If moq is not provided, default to 0
        image: files[index] ? files[index].filename : null  // Store image filename (Multer saves the filename)
      };
    });

    // Create a new user and associate the products with them
    const newUser = new User({
      username,
      email,
      products: productData
    });

    // Save the new user to the database
    await newUser.save();

    res.redirect("/admin");  // Redirect to admin dashboard to view the updated list
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send("Internal Server Error");
  }
};

