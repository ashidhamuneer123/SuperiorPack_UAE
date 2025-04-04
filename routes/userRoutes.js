import express from "express";
import { loadHome , instantQuote ,sendQuote,userDashboard,userLogin,aboutUs} from "../controllers/userController.js";
import upload from "../middlewares/multerConfig.js"; 
const router = express.Router();


router.get("/", loadHome);
router.get('/quote',instantQuote)
router.post('/quote',upload,sendQuote)
router.get('/login',userLogin)
router.get('/userdashboard',userDashboard)
router.get('/about',aboutUs)
export default router;