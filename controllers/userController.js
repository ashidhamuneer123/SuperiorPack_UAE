import Product from "../models/Product.js";
import Category from "../models/Category.js";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import EnquiryNumber from "../models/EnquiryNumber.js";
import EnquiryCartNumber from "../models/EnquiryCartNumber.js";

import mongoose from 'mongoose';
export const loadHome = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });

    // Fetch all products
    const allProducts = await Product.find().populate('catId');

    // Grouping Maps
    const customizedCategoryProductsMap = {};
    const genericCategoryProductsMap = {};
    const conceptCategoryProductsMap = {}; // 🆕 for concept-based

    allProducts.forEach(product => {
      if (product.catId) {
        const categoryId = product.catId._id.toString();

        if (product.isConcept) {
          if (!conceptCategoryProductsMap[categoryId]) {
            conceptCategoryProductsMap[categoryId] = [];
          }
          conceptCategoryProductsMap[categoryId].push(product);
        } else if (product.isCustomized) {
          if (!customizedCategoryProductsMap[categoryId]) {
            customizedCategoryProductsMap[categoryId] = [];
          }
          customizedCategoryProductsMap[categoryId].push(product);
        } else {
          if (!genericCategoryProductsMap[categoryId]) {
            genericCategoryProductsMap[categoryId] = [];
          }
          genericCategoryProductsMap[categoryId].push(product);
        }
      }
    });

    const products = await Product.find({ isCustomized: true }).limit(12).sort({ timestamp: -1 });
    const custProducts = await Product.find({ isCustomized: true }).limit(8).sort({ timestamp: 1 });

    res.render("home", {
      categories,
      customizedCategoryProductsMap,
      genericCategoryProductsMap,
      conceptCategoryProductsMap, // 🆕 added
      categoryProductsMap: {
        ...customizedCategoryProductsMap,
        ...genericCategoryProductsMap,
        ...conceptCategoryProductsMap,
      },
      products,
      custProducts
    });
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
        // Fetch the current enquiry number and increment it
        const enquiryNumberDoc = await EnquiryNumber.findOneAndUpdate(
            {}, 
            { $inc: { currentNumber: 1 } }, 
            { new: true, upsert: true } // Create if not found
        );

        const enquiryNumber = `IQ${enquiryNumberDoc.currentNumber}`;

        // Get form data from the request body
        const { name, contact, email, message } = req.body;
        const categories = Array.isArray(req.body.categories) ? req.body.categories.join(', ') : req.body.categories;

        // Handle logo files if they exist
        const logos = req.files?.logo ? req.files.logo.map(file => ({
            filename: file.originalname,
            url: file.path, // Cloudinary returns the URL in `file.path`
        })) : [];

        // Set up email transport
        const transporter = nodemailer.createTransport({
          host: 'mail.privateemail.com', 
          port: 465,
          secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email content with the enquiry number
        const mailOptions = {
            from: `"Instant Quote Mail" <${process.env.EMAIL_USER}>`,
            to: process.env.COMPANY_MAIL,  // Your target email address
            subject: `New Quote Request from ${name} - Enquiry #${enquiryNumber} - ${new Date().toLocaleString()}`,
            html: `
                <p><strong>Enquiry Number:</strong> ${enquiryNumber}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Categories:</strong> ${categories}</p>
                <p><strong>Message:</strong> ${message}</p>
            `,
            attachments: logos.map(logo => ({
                filename: logo.filename,
                path: logo.url, // Cloudinary image path
            })),
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // Send a response back to the client with the enquiry number
        res.json({ success: true, message: `Quote submitted successfully! Your enquiry number is #${enquiryNumber}.` });
    } catch (error) {
        console.error('Error sending quote:', error);
        res.status(500).json({ success: false, message: 'Error sending quote' });
    }
};
export const productDetailPage = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate("catId");
    const categories = await Category.find({ isDeleted: false });
    const productsByCategory = await Product.find().populate('catId');

    // Map products by category
    const categoryProductsMap = {};
    productsByCategory.forEach(prod => {
      if (prod.catId) {
        const categoryId = prod.catId._id.toString();
        if (!categoryProductsMap[categoryId]) {
          categoryProductsMap[categoryId] = [];
        }
        categoryProductsMap[categoryId].push(prod);
      }
    });

    // Determine related products logic
    let relatedProducts = [];
    if (product.isConcept) {
      // For concept-based products, get other concept products (excluding self)
      relatedProducts = await Product.find({
        _id: { $ne: product._id },
        isConcept: true
      }).limit(5);
    } else {
      // For regular/customized products, get products in the same category (excluding self)
      relatedProducts = await Product.find({
        catId: product.catId._id,
        _id: { $ne: product._id },
        isConcept: false
      }).limit(4);
    }

    res.render("productDetail", {
      product: product.toObject(),
      categories,
      categoryProductsMap,
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
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


export const userDashboard = async (req, res) => {
  try {
    const { _id } = req.session.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

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

    const user = await User.findById(_id).lean();
    if (!user) return res.status(404).send("User not found");

    const activeProducts = user.products.filter(p => p.status === 'active');
    const totalProducts = activeProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = activeProducts.slice(skip, skip + limit);

    const prodIds = paginatedProducts.map(p => p.prodID);
    const mainProducts = await Product.find({ prod_id: { $in: prodIds } }).lean();

    const enrichedProducts = paginatedProducts.map(product => {
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
      categoryProductsMap,
      currentPage: page,
      totalPages,
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
  
      const query = req.query.query?.trim();
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;
  
      if (!query) {
        return res.render("searchResults", {
          products: [],
          searchTerm: "",
          categories,
          categoryProductsMap,
          currentPage: 1,
          totalPages: 0
        });
      }
  
      const totalProducts = await Product.countDocuments({
        name: { $regex: query, $options: 'i' }
      });
  
      const totalPages = Math.ceil(totalProducts / limit);
  
      const products = await Product.find({
        name: { $regex: query, $options: 'i' }
      })
        .skip(skip)
        .limit(limit)
        .lean();
  
      res.render("searchResults", {
        products,
        searchTerm: query,
        categories,
        categoryProductsMap,
        currentPage: page,
        totalPages
      });
  
    } catch (error) {
      console.error("Error during search:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  export const filterByCategory = async (req, res) => {
    try {
      const slug = req.params.slug;
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;
  
      const selectedCategory = await Category.findOne({ slug });
      if (!selectedCategory) {
        return res.status(404).send("Category not found");
      }
  
      const categoryId = selectedCategory._id;
  
      const categories = await Category.find({ isDeleted: false });
      const productsByCategory = await Product.find().populate('catId');
  
      const categoryProductsMap = {};
      productsByCategory.forEach(product => {
        if (product.catId) {
          const id = product.catId._id.toString();
          if (!categoryProductsMap[id]) {
            categoryProductsMap[id] = [];
          }
          categoryProductsMap[id].push(product);
        }
      });
  
      const totalProducts = await Product.countDocuments({ catId: categoryId });
      const totalPages = Math.ceil(totalProducts / limit);
  
      const products = await Product.find({ catId: categoryId })
        .skip(skip)
        .limit(limit)
        .lean();
  
      res.render("searchResults", {
        products,
        searchTerm: selectedCategory.name,
        categories,
        categoryProductsMap,
        currentPage: page,
        totalPages
      });
  
    } catch (error) {
      console.error("Error filtering products by category:", error);
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
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const token = req.body.token;
  
      // Verify reCAPTCHA with Google
      const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  
      const response = await fetch(verificationURL, { method: 'POST' });
      const data = await response.json();
  
      if (!data.success) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
      }
  
      const { name, email, phone, message } = req.body;
  
      const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: `"Contact Mail" <${process.env.EMAIL_USER}>`,
        to: process.env.COMPANY_MAIL,
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



  export const allProducts = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const skip = (page - 1) * limit;
      const sortOption = req.query.sort || 'latest';
      const categoryFilterRaw = req.query.categories?.split(',') || [];
      const categoryFilter = categoryFilterRaw.filter(id => mongoose.Types.ObjectId.isValid(id)); // Check for valid ObjectId(s)
      const typeFilter = req.query.type || 'all';
  
      // Sorting logic
      let sortCriteria;
      switch (sortOption) {
        case 'latest':
          sortCriteria = { timestamp: -1 };
          break;
        case 'popularity':
          sortCriteria = { views: -1 };
          break;
        case 'az':
          sortCriteria = { name: 1 };
          break;
        case 'za':
          sortCriteria = { name: -1 };
          break;
        default:
          sortCriteria = { timestamp: -1 };
      }
  
      // Filter logic
      const filter = {};
      if (typeFilter === 'generic') filter.isCustomized = false;
      if (typeFilter === 'customized') filter.isCustomized = true;
       if (typeFilter === 'concept') filter.isConcept = true;
      if (categoryFilter.length) filter.catId = { $in: categoryFilter };
  
      const categories = await Category.find();
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);
  
      const products = await Product.find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate("catId");
  
      // Handle AJAX request for pagination/filtering
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ products, totalPages });
      }
  
      // Build categoryProductsMap (used for navbar dropdowns)
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
  
      // Render full page
      res.render("allProducts", {
        categories,
        products,
        categoryProductsMap,
        currentPage: page,
        totalPages,
        selectedSort: sortOption,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  



  export const addToEnquirySession = async (req, res) => {
    try {
      const productId = req.params.id;
  
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).send("Product not found");
      }
  
      // Initialize enquiryProducts session array if not present
      if (!req.session.enquiryProducts) {
        req.session.enquiryProducts = [];
      }
  
      // Check if product already exists in the session
      const exists = req.session.enquiryProducts.find(p => p.prod_id === product.prod_id);
      if (!exists) {
        req.session.enquiryProducts.push({
          prod_id: product.prod_id,
          name: product.name,
          moq: product.moq,
          size: "",
          message: ""
        });
      }
  
      req.session.save(() => {
        res.status(200).send("Added to enquiry");
      });
    } catch (error) {
      console.error("Error adding to enquiry:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  export const showEnquiryCart = async (req, res) => {
    try {
      const enquiryProducts = req.session.enquiryProducts || [];
  
      // For navbar (categories)
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
     

  
      res.render("enquiry", { enquiryProducts, categories, categoryProductsMap });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  };
  
  export const removeFromEnquiry = async (req, res) => {
    const productId = req.params.prodId;
  
    // Your logic for removing the product from the session or database
    if (req.session.enquiryProducts) {
      req.session.enquiryProducts = req.session.enquiryProducts.filter(
        (product) => product.prod_id !== productId
      );
    }
  
    // Send a response back to the client
    res.status(200).send({ message: 'Product removed from enquiry' });
  };


  export const sendEnquiryEmail = async (req, res) => {
    const { name, email, phone, additionalMessage, products } = req.body;
  
    let parsedProducts = [];
    try {
      parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid product data' });
    }
  
    // Step 1: Get the new enquiry cart number
    let enquiryCartNumber;
    try {
      const enquiryCartDoc = await EnquiryCartNumber.findOneAndUpdate(
        {},
        { $inc: { currentNumber: 1 } },
        { new: true, upsert: true }
      );
      const formattedNumber = String(enquiryCartDoc.currentNumber).padStart(4, '0');
      enquiryCartNumber = `EC${formattedNumber}`;
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to generate enquiry number' });
    }
  
    const productRows = parsedProducts.map(prod => `
      <tr>
        <td>${prod.prod_id || ''}</td>
        <td>${prod.name || ''}</td>
        <td>${prod.moq || ''}</td>
        <td>${prod.size || ''}</td>
        <td>${prod.message || ''}</td>
      </tr>
    `).join('');
  
    const htmlContent = `
      <h3>New Product Enquiry</h3>
      <p><strong>Enquiry No:</strong> ${enquiryCartNumber}</p>
      <h4>Customer Details</h4>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${additionalMessage}</p>
  
      <h4>Product Enquiry</h4>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead style="background-color: #f2f2f2;">
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Size</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    `;
  
    try {
      const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com', 
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        from: `"Enquiry Mail" <${process.env.EMAIL_USER}>`,
        to: process.env.COMPANY_MAIL,
        subject: `New Product Enquiry - ${enquiryCartNumber}`,
        html: htmlContent,
      });
  
      // ✅ Clear session cart after successful email
      req.session.enquiryProducts = [];
      req.session.save(() => {
        res.status(200).json({ success: true, message: `Enquiry submitted successfully. Your Enquiry No is ${enquiryCartNumber}` });
      });
  
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  };
  
 
export const getEnquiryCount = (req, res) => {
  const count = req.session.enquiryProducts?.length || 0;
  res.status(200).json({ count });
};

export const faqPage = async (req, res) => {
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

    res.render("faq", { categories, categoryProductsMap });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

export const allCategories = async (req, res) => {
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

    res.render("allCategories", { categories, categoryProductsMap });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
export const internationalOrders = async (req, res) => {
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

    res.render("internationalOrders", { categories, categoryProductsMap });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

export const privacyPolicy = async (req, res) => {
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

    res.render("privacyPolicy", { categories, categoryProductsMap });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};


export const filterProducts = async (req, res) => {
  try {
    const { categories = [], sort = 'latest' } = req.body;

    // Determine sort criteria
    let sortCriteria;
    switch (sort) {
      case 'latest': sortCriteria = { timestamp: -1 }; break;
      case 'popularity': sortCriteria = { views: -1 }; break;
      case 'az': sortCriteria = { name: 1 }; break;
      case 'za': sortCriteria = { name: -1 }; break;
      default: sortCriteria = { timestamp: -1 };
    }

    // Category filter
    const categoryCondition = categories.length ? { catId: { $in: categories } } : {};

    // Fetch products based on category and sorting
    const products = await Product.find(categoryCondition).sort(sortCriteria).populate('catId');

    res.send({
      html: renderProductsHTML(products)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching filtered products');
  }
};

function renderProductsHTML(products) {
  return products.map(product => `
    <div class="col-lg-4 col-md-6 col-sm-12 pb-1">
      <div class="card product-item border-0 mb-4">
        <div class="card-header product-img position-relative overflow-hidden bg-transparent border p-0">
          <img class="img-fluid w-100" src="${product.image[0]}" alt="${product.name}">
        </div>
        <div class="card-body border-left border-right text-center p-0 pt-4 pb-3">
          <a href="/product/${product._id}">
            <h6 class="text-truncate mb-3">${product.name}</h6>
          </a>
          <div class="d-flex justify-content-center">
            <h6>MOQ: ${product.moq}</h6>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-between bg-light border">
          <a href="/product/${product._id}" class="btn btn-sm text-dark p-0"><i class="fas fa-eye text-primary mr-1"></i>View Detail</a>
          <a href="" class="btn btn-sm text-dark p-0"><i class="fas fa-shopping-cart text-primary mr-1"></i>Add To Cart</a>
        </div>
      </div>
    </div>
  `).join('');
}



