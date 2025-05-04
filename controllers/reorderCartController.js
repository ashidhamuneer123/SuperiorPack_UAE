import Product from "../models/Product.js";
import Category from "../models/Category.js";

export const addToReorderCart = async (req, res) => {
    try {
      const { prod_id, name, moq, size } = req.body;
      if (!req.session.reorderCart) req.session.reorderCart = [];
  
      // Avoid duplicates
      const exists = req.session.reorderCart.find(p => p.prod_id === prod_id);
      if (!exists) {
        req.session.reorderCart.push({ prod_id, name, moq, size });
      }
  
      res.redirect('/userdashboard');
    } catch (err) {
      console.error("Error adding to reorder cart:", err);
      res.status(500).send("Error");
    }
  };
  
  export const viewReorderCart =async (req, res) => {
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
      const reorderProducts = req.session.reorderCart || [];
      res.render('reorderCart', {  session: req.session, reorderProducts ,categories,categoryProductsMap});
    } catch (err) {
      console.error("Error viewing reorder cart:", err);
      res.status(500).send("Error");
    }
  };
  
  export const removeFromReorderCart = (req, res) => {
    const { prod_id } = req.body;
    req.session.reorderCart = (req.session.reorderCart || []).filter(p => p.prod_id !== prod_id);
    res.redirect('/reorder-cart');
  };
  