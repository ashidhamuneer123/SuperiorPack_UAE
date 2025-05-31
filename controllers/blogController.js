import Product from "../models/Product.js";
import Category from "../models/Category.js";

import Blog from '../models/Blog.js';

export const showAddBlogPage = async (req, res) => {
  try {
    
    res.render("addBlog");
  } catch (error) {
    console.error("Error fetching Blogs:", error);
    res.status(500).send("Internal Server Error");
  }
};




export const addBlog = async (req, res) => {
  try {
    const { title,content } = req.body;
    const blogImage = req.files?.blogImage
      ? req.files.blogImage.map(file => file.path)
      : [];

    const blog = new Blog({
      title,
      content,
      image: blogImage
    });

    await blog.save();
    res.redirect('/admin/viewBlogs');
  } catch (error) {
    console.error("Error saving blog:", error);
    res.status(500).send("Internal Server Error");
  }
};


export const viewBlogs = async (req, res) => {

  try {
    const blogs = await Blog.find({isDeleted:false});
   res.render('viewBlogs',{blogs})
  } catch (err) {
    res.status(500).send('Failed to remove Blog');
  }
};

export const deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.redirect('/admin/viewBlogs');
  } catch (error) {
    console.error("Error deleting Blog:", error);
    res.status(500).send("Internal Server Error");
  }
};
export const showEditBlogPage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    res.render("editBlog", { blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { title,content } = req.body;
    const image = req.files?.blogImage
      ? req.files.blogImage.map(file => file.path)
      : undefined;

    const updateData = { title,content };
    if (image) updateData.image = image;

    await Blog.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/viewBlogs');
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).send("Internal Server Error");
  }
};


//user Side blog functions

export const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
      const totalBlogs = await Blog.countDocuments();
          const totalPages = Math.ceil(totalBlogs / limit);
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
    const blogs = await Blog.find({ isDeleted: false }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.render('userBlogView', { blogs,categories,categoryProductsMap,currentPage: page,totalPages, });
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
