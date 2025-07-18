import express from "express";
import { loadHome , instantQuote ,sendQuote,userDashboard,contactUs,contactUsMail,showEnquiryCart,userLoginPage,userLogin,aboutUs,userLogout,productDetailPage,searchProducts, allProducts,  addToEnquirySession, removeFromEnquiry,sendEnquiryEmail,getEnquiryCount, faqPage, filterByCategory, filterProducts, internationalOrders, privacyPolicy, allCategories} from "../controllers/userController.js";
import upload from "../middlewares/multerConfig.js"; 
import { addToReorderCart, viewReorderCart, removeFromReorderCart, submitReorder } from '../controllers/reorderCartController.js';
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
router.get('/product/:slug', productDetailPage);

router.get('/search', searchProducts);
router.get('/blogs', getAllBlogs);
router.get('/blog/:id', getBlogDetails);
router.get('/contact', contactUs);
router.post('/contact',contactUsMail)
router.get('/allProducts', allProducts);
router.get('/add-to-enquiry/:id', addToEnquirySession);
router.get('/enquiry-cart',showEnquiryCart)
router.post('/remove-from-enquiry/:prodId',removeFromEnquiry)
router.post('/submit-enquiry', sendEnquiryEmail);
router.get('/enquiry-count', getEnquiryCount);
router.get('/faq',faqPage);
router.get('/internationalOrders',internationalOrders);
router.get('/allCategories',allCategories)
router.get('/privacyPolicy',privacyPolicy)
router.get('/products/category/:slug', filterByCategory);
router.post('/products/filter', filterProducts);
router.post('/reorder-cart/add', userAuth, addToReorderCart);
router.get('/reorder-cart', userAuth, viewReorderCart);
router.post('/reorder-cart/remove', userAuth, removeFromReorderCart);
router.post('/reorder-cart/submit',submitReorder)
export default router;