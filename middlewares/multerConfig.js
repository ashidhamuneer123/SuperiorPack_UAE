import multer from 'multer';
import path from 'path';

// Set up Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure 'uploads/' exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file
    },
});

const upload = multer({ storage: storage }).fields([
    { name: 'productImages', maxCount: 5 },
    { name: 'logo', maxCount: 1 },
]);

// Correct export
export default upload;
