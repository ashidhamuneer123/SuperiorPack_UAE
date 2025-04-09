import express from "express";
import upload from "../middlewares/multerConfig.js"; 
import { showAdminDashboard,showLoginPage, handleAdminLogin, handleAdminLogout,showAddProductPage,addProduct,blockUser,showAddCategoryPage,addCategory,showEditCategoryPage,updateCategory,deleteCategory} from "../controllers/adminController.js";
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
router.get("/category/edit/:id", adminAuth, showEditCategoryPage);
router.post("/category/edit/:id", adminAuth, upload, updateCategory);
router.get("/category/delete/:id", adminAuth, deleteCategory);

router.get("/addProduct", adminAuth, showAddProductPage);

router.post("/addProduct", adminAuth,upload,addProduct );

// Block user
router.post('/block-user/:userId', adminAuth,blockUser);

export default router;
