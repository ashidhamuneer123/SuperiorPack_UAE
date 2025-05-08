import Category from "../models/Category.js";
import Product from "../models/Product.js"
import User from '../models/User.js';

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
      leadTime, isCustomized, prod_id, catId, printing, ingredients,
      minOrderWithPrinting, minOrderWithoutPrinting, moreInfo
    } = req.body;

    const mainImage = req.files?.mainImage?.[0]?.path || '';
    const subImages = req.files?.productImages?.map(file => file.path) || [];
    
    const imageFiles = [mainImage, ...subImages];
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
    
    const newProduct = new Product({
      name,
      moq,
      description,
      material,
      function: productFunction,
      size,
      leadTime,
      image: imageFiles,
      isCustomized: isCustomized === 'true',
      prod_id,
      catId,
      printing,
      ingredients,
      minOrderWithPrinting,
      minOrderWithoutPrinting,
     moreInfo,
     customSizes: formattedSizes

    });

    await newProduct.save();
res.redirect('/admin/viewProducts')
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