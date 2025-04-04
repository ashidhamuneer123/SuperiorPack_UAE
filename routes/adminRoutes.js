import express from "express";
import upload from "../middlewares/multerConfig.js"; 
import { showAdminDashboard, addUser ,showLoginPage, handleAdminLogin, handleAdminLogout,showAddUserPage} from "../controllers/adminController.js";
import { adminAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Admin login routes
router.get("/login", showLoginPage);
router.post("/login", handleAdminLogin);
router.get("/logout", handleAdminLogout);

// Admin dashboard route
router.get("/",adminAuth, showAdminDashboard);

// Route for displaying the add user page
router.get("/add", adminAuth, showAddUserPage);

// Route for adding a new user with products
router.post("/add", adminAuth, upload, addUser);

export default router;
