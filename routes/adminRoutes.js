import express from "express";
import upload from "../middlewares/multerConfig.js"; 
import { showAdminDashboard,showLoginPage, handleAdminLogin, handleAdminLogout,showAddUserPage,showAddBlogPage,addBlog,createUser,deactivateUserProduct,showAddProductForm,addProductToUser,showEditUserPage,editUser,toggleUserStatus,showAddProductPage,addProduct,blockUser,showAddCategoryPage,addCategory,viewCategories,showEditCategoryPage,updateCategory,deleteCategory, viewProducts, viewUsers, deleteBlog, updateBlog, showEditBlogPage, viewBlogs} from "../controllers/adminController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Admin login routes
router.get("/login", showLoginPage);
router.post("/login", handleAdminLogin);
router.get("/logout", handleAdminLogout);

// Admin dashboard route
router.get("/",adminAuth, showAdminDashboard);

router.get("/addCategory", adminAuth, showAddCategoryPage);
router.post("/addCategory", adminAuth, upload, addCategory);
router.get("/viewCategories", adminAuth, viewCategories);
router.get("/category/edit/:id", adminAuth, showEditCategoryPage);
router.post("/category/edit/:id", adminAuth, upload, updateCategory);
router.get("/category/delete/:id", adminAuth, deleteCategory);

router.get("/addUser", adminAuth, showAddUserPage);
router.post("/addUser", adminAuth,upload,createUser );
router.get("/viewUsers",adminAuth,viewUsers)
router.get("/user/edit/:id", adminAuth, showEditUserPage);
router.post("/user/edit/:id", adminAuth, editUser);
router.post('/user/:id/product/:index/deactivate', deactivateUserProduct);

router.get('/user/toggle-status/:id', toggleUserStatus);
router.get('/user/add-product/:userId', showAddProductForm);//customised product
router.post('/user/add-product/:userId',upload, addProductToUser);


router.get("/addProduct", adminAuth, showAddProductPage);

router.post("/addProduct", adminAuth,upload,addProduct );
router.get("/viewProducts", adminAuth, viewProducts);

// Block user
router.post('/block-user/:userId', adminAuth,blockUser);

//blog


router.get("/addBlog", adminAuth, showAddBlogPage);
router.post("/addBlog", adminAuth, upload, addBlog);
router.get("/viewBlogs", adminAuth, viewBlogs);
router.get("/blog/edit/:id", adminAuth, showEditBlogPage);
router.post("/blog/edit/:id", adminAuth, upload, updateBlog);
router.get("/blog/delete/:id", adminAuth, deleteBlog);
export default router;
