import Category from "../models/Category.js";
import Product from "../models/Product.js"
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
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
      name, moq, description, material, function: productFunction, size,
      leadTime, isCustomized, isConcept,prod_id, catId, printing, ingredients,
      minOrderWithPrinting, minOrderWithoutPrinting, moreInfo
    } = req.body;

    const { customSizes = [], systemCode = [] } = req.body;

    let formattedSizes = [];

    if (Array.isArray(customSizes) && Array.isArray(systemCode)) {
      formattedSizes = customSizes.map((size, index) => ({
        size,
        systemCode: systemCode[index] || ''
      }));
    } else if (customSizes && systemCode) {
      // Handle single entry case
      formattedSizes.push({
        size: customSizes,
        systemCode: systemCode
      });
    }

    // ⬇️ Image upload in correct order using Cloudinary SDK
    const uploadedImages = [];

    // Upload mainImage first
    if (req.files?.mainImage?.[0]) {
      const mainImageResult = await cloudinary.uploader.upload(req.files.mainImage[0].path, {
        folder: 'mainImages',
        public_id: `${Date.now()}-main`,
      });
      uploadedImages.push(mainImageResult.secure_url); // Add the main image URL to the array
    }

    // Upload productImages next (preserve order)
    if (req.files?.productImages?.length) {
      for (const file of req.files.productImages) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'products',
          public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '-').toLowerCase()}`,
        });
        uploadedImages.push(result.secure_url); // Add the sub images URLs to the array
      }
    }

    const newProduct = new Product({
      name,
      moq,
      description,
      material,
      function: productFunction,
      size,
      leadTime,
      image: uploadedImages, // Ordered images here
      isCustomized: isCustomized === 'true',
      isConcept: isConcept === 'true',

      prod_id,
      catId,
      printing,
      ingredients,
      minOrderWithPrinting,
      minOrderWithoutPrinting,
      moreInfo,
      customSizes: formattedSizes
    });

    await newProduct.save(); // Save the new product to DB
    res.redirect('/admin/viewProducts'); // Redirect after saving

  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving product');
  }
};



export const viewProducts = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = 5;
  const skip = (currentPage - 1) * perPage;

  try {
    // Get total number of products
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    // Fetch products with pagination
    const products = await Product.find()
      .sort({ timestamp: -1 }) // optional: newest first
      .skip(skip)
      .limit(perPage)
      .lean();

    // Get all users who have customized any product
    const users = await User.find({}, 'name userId products').lean();

    // Map products with customized users
    const productsWithUsers = products.map(product => {
      const customizedUsers = users.filter(user =>
        user.products.some(p => p.prodID === product.prod_id)
      ).map(user => ({
        userId: user.userId,
        name: user.name
      }));

      return {
        ...product,
        customizedUsers
      };
    });

    res.render('viewProducts', {
      products: productsWithUsers,
      currentPage,
      totalPages
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load products');
  }
};

export const showEditProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    const categories = await Category.find().lean();
    if (!product) return res.status(404).send("Product not found");

    res.render("editProduct", { product, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load edit page");
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      name, moq, description, material, function: productFunction, size,
      leadTime, isCustomized, prod_id, catId, printing, ingredients,
      minOrderWithPrinting, minOrderWithoutPrinting, moreInfo
    } = req.body;

    const { customSizes = [], systemCode = [] } = req.body;

    let formattedSizes = [];

    if (Array.isArray(customSizes) && Array.isArray(systemCode)) {
      formattedSizes = customSizes.map((size, index) => ({
        size,
        systemCode: systemCode[index] || ''
      }));
    } else if (customSizes && systemCode) {
      formattedSizes.push({
        size: customSizes,
        systemCode: systemCode
      });
    }

    const uploadedImages = [];

    if (req.files?.mainImage?.[0]) {
      const mainImageResult = await cloudinary.uploader.upload(req.files.mainImage[0].path, {
        folder: 'mainImages',
        public_id: `${Date.now()}-main`,
      });
      uploadedImages.push(mainImageResult.secure_url);
    }

    if (req.files?.productImages?.length) {
      for (const file of req.files.productImages) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'products',
          public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '-').toLowerCase()}`,
        });
        uploadedImages.push(result.secure_url);
      }
    }

    const updateData = {
      name,
      moq,
      description,
      material,
      function: productFunction,
      size,
      leadTime,
      isCustomized: isCustomized === 'true',
      prod_id,
      catId,
      printing,
      ingredients,
      minOrderWithPrinting,
      minOrderWithoutPrinting,
      moreInfo,
      customSizes: formattedSizes
    };

    if (uploadedImages.length > 0) {
      updateData.image = uploadedImages;
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/viewProducts');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product");
  }
};
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/viewProducts');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
};
