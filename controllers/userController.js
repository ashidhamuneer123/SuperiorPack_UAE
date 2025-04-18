import Product from "../models/Product.js";
import Category from "../models/Category.js";
import nodemailer from "nodemailer";
import User from "../models/User.js";
export const loadHome = async (req, res) => {
  try {
  

 // fetch categories and products for rendering
    const categories = await Category.find({ isDeleted: false });
    const productsByCategory = await Product.find().populate('catId');

    const categoryProductsMap = {};
    productsByCategory.forEach(product => {
      if (product.catId) {
        const categoryId = product.catId._id.toString();
        if (!categoryProductsMap[categoryId]) {
          categoryProductsMap[categoryId] = [];
        }
        categoryProductsMap[categoryId].push(product);
      }
    });
    
    const products = await Product.find().limit(8).sort({ timestamp: -1 }); 
    const custProducts = await Product.find({isCustomized:true}).limit(8).sort({ timestamp: -1 }); 
    res.render("home", { categories, categoryProductsMap ,products,custProducts});

  } catch (error) {
    console.error("Error loading home:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const instantQuote = async (req, res) => {
    try {
      const categories = await Category.find({ isDeleted: false }).lean();
      const productsByCategory = await Product.find().populate('catId');
      const categoryProductsMap = {};
      productsByCategory.forEach(product => {
        if (product.catId) {
          const categoryId = product.catId._id.toString();
          if (!categoryProductsMap[categoryId]) {
            categoryProductsMap[categoryId] = [];
          }
          categoryProductsMap[categoryId].push(product);
        }
      });
      res.render("quote",{categories,categoryProductsMap});
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };


  export const sendQuote = async (req, res) => {
    try {
        const { name, contact, email, message} = req.body;
        const categories = Array.isArray(req.body.categories) ? req.body.categories.join(', ') : req.body.categories;

        const logos = req.files?.logo ? req.files.logo.map(file => ({
          filename: file.originalname,
          url: file.path, // Cloudinary returns the URL in `file.path`
      })) : [];

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'ashidhagithub@gmail.com',
          subject: `New Quote Request from ${name} - ${new Date().toLocaleString()}`,
          html: `
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Contact:</strong> ${contact}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>categories:</strong> ${categories}</p>
              <p><strong>Message:</strong> ${message}</p>
          `,
          attachments: logos.map(logo => ({
              filename: logo.filename,
              path: logo.url, // cloudinary image path
          })),
      };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Quote submitted successfully!' });
    } catch (error) {
        console.error('Error sending quote:', error);
        res.status(500).json({ success: false, message: 'Error sending quote' });
    }
};

export const productDetailPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    // Fetch categories that are not deleted
    const categories = await Category.find({ isDeleted: false });

    // Fetch products and group them by category
    const productsByCategory = await Product.find().populate('catId');

    // Create a map of categoryId to product list
    const categoryProductsMap = {};

    productsByCategory.forEach(product => {
      if (product.catId) {
        const categoryId = product.catId._id.toString();
        if (!categoryProductsMap[categoryId]) {
          categoryProductsMap[categoryId] = [];
        }
        categoryProductsMap[categoryId].push(product);
      }
    });

  
    res.render("productDetail",{ product,categories, categoryProductsMap });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const userLoginPage = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    const productsByCategory = await Product.find().populate('catId');

  const categoryProductsMap = {};
  productsByCategory.forEach(product => {
    if (product.catId) {
      const categoryId = product.catId._id.toString();
      if (!categoryProductsMap[categoryId]) {
        categoryProductsMap[categoryId] = [];
      }
      categoryProductsMap[categoryId].push(product);
    }
  });
    res.render("userLogin",{categories,categoryProductsMap});
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const userLogin = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Check for matching user
    const user = await User.findOne({ userId, email });

    if (!user) {
      return res.status(404).send("Invalid credentials. Please try again.");
    }

    // ✅ Save the actual MongoDB _id to session
    req.session.user = {
      _id: user._id,       // this is the key change
      userId: user.userId,
      email: user.email,
    };

    res.redirect("/userdashboard");
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).send("Internal Server Error");
  }
};


// Fetch products for the user in the dashboard
export const userDashboard = async (req, res) => {
  try {
    const { _id} = req.session.user;
    const categories = await Category.find({ isDeleted: false });
    const productsByCategory = await Product.find().populate('catId');

  const categoryProductsMap = {};
  productsByCategory.forEach(product => {
    if (product.catId) {
      const categoryId = product.catId._id.toString();
      if (!categoryProductsMap[categoryId]) {
        categoryProductsMap[categoryId] = [];
      }
      categoryProductsMap[categoryId].push(product);
    }
  });
    // Get user and their active embedded products
    const user = await User.findById(_id).lean();
    if (!user) return res.status(404).send("User not found");

    const activeProducts = user.products.filter(p => p.status === 'active');

    // Collect all prodIDs to lookup in main Product collection
    const prodIds = activeProducts.map(p => p.prodID);

    // Find full product details for those IDs
    const mainProducts = await Product.find({ prod_id: { $in: prodIds } }).lean();

    // Merge product name from Product schema into embedded products
    const enrichedProducts = activeProducts.map(product => {
      const matching = mainProducts.find(p => p.prod_id === product.prodID);
      return {
        ...product,
        name: matching ? matching.name : 'Unknown Product',
      };
    });

    res.render("userDashboard", {
      session: req.session,
      userId: user.userId,
      userEmail: user.email,
      userName: user.name,
      products: enrichedProducts,
      categories,
      categoryProductsMap
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Internal Server Error");
  }
};



  export const aboutUs = async (req, res) => {
    try {
      const categories = await Category.find({ isDeleted: false });
      const productsByCategory = await Product.find().populate('catId');

    const categoryProductsMap = {};
    productsByCategory.forEach(product => {
      if (product.catId) {
        const categoryId = product.catId._id.toString();
        if (!categoryProductsMap[categoryId]) {
          categoryProductsMap[categoryId] = [];
        }
        categoryProductsMap[categoryId].push(product);
      }
    });
      res.render("about",{categories,categoryProductsMap});
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  };

  export const userLogout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Could not log out.");
      }
      res.redirect('/login');
    });
  };

  export const searchProducts = async (req, res) => {
    try {
      const query = req.query.query?.trim();
  
      if (!query) {
        return res.render("searchResults", { products: [], searchTerm: "" });
      }
  
      // Case-insensitive search for product name
      const products = await Product.find({
        name: { $regex: query, $options: 'i' },
      }).lean();
  
      res.render("searchResults", {
        products,
        searchTerm: query,
      });
  
    } catch (error) {
      console.error("Error during search:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  

  export const contactUs = async (req, res) => {
    try {
      const categories = await Category.find({ isDeleted: false }).lean();
      const productsByCategory = await Product.find().populate('catId');
      const categoryProductsMap = {};
      productsByCategory.forEach(product => {
        if (product.catId) {
          const categoryId = product.catId._id.toString();
          if (!categoryProductsMap[categoryId]) {
            categoryProductsMap[categoryId] = [];
          }
          categoryProductsMap[categoryId].push(product);
        }
      });
      res.render("contact",{categories,categoryProductsMap});
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  export const contactUsMail = async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'ashidhaa@gmail.com',
        subject: `New Contact Message from ${name} - ${new Date().toLocaleString()}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
      console.error('Error sending contact message:', error);
      res.status(500).json({ success: false, message: 'Error sending message' });
    }
  };
  