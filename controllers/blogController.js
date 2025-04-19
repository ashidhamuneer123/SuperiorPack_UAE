import Product from "../models/Product.js";
import Category from "../models/Category.js";

import Blog from '../models/Blog.js';

export const getAllBlogs = async (req, res) => {
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
    const blogs = await Blog.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.render('userBlogView', { blogs,categories,categoryProductsMap });
  } catch (error) {
    console.error("Error loading blogs:", error);
    res.status(500).send("Server Error");
  }
};

export const getBlogDetails = async (req, res) => {
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
      const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });
  
      if (!blog) {
        return res.status(404).send('Blog not found');
      }
  
      res.render('blogDetails', { blog,categories,categoryProductsMap });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };
