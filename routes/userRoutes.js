import express from "express";
import { loadHome , instantQuote ,sendQuote,userDashboard,contactUs,contactUsMail,userLoginPage,userLogin,aboutUs,userLogout,productDetailPage,searchProducts} from "../controllers/userController.js";
import upload from "../middlewares/multerConfig.js"; 
import { userAuth } from "../middlewares/authMiddleware.js";
import { getAllBlogs,getBlogDetails } from '../controllers/blogController.js';
const router = express.Router();


router.get("/", loadHome);
router.get('/quote',instantQuote)
router.post('/quote',upload,sendQuote)
router.get('/login',userLoginPage)
router.post('/login', userLogin); 
router.get('/logout', userLogout);
router.get('/userdashboard',userAuth,userDashboard)
router.get('/about',aboutUs)
router.get('/product/:id',productDetailPage)
router.get('/search', searchProducts);
router.get('/blogs', getAllBlogs);
router.get('/blog/:id', getBlogDetails);
router.get('/contact', contactUs);
router.post('/contact',contactUsMail)
export default router;