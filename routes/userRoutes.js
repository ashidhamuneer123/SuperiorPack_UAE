import express from "express";
import { loadHome , instantQuote ,sendQuote,userDashboard,userLoginPage,userLogin,aboutUs,userLogout,productDetailPage} from "../controllers/userController.js";
import upload from "../middlewares/multerConfig.js"; 
import { userAuth } from "../middlewares/authMiddleware.js";
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
export default router;