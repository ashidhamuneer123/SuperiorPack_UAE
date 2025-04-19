import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Multer file filter to ensure only jpg, png, and webp files are uploaded
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(file.mimetype);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, png, and webp are allowed.'));
  }
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'superiorpack'; // default folder
    
    if (file.fieldname === 'logo') {
      folder = 'logos';
    } else if (file.fieldname === 'productImages') {
      folder = 'products';
    } else if (file.fieldname === 'customProductImages') {
      folder = 'customProducts';
    } else if (file.fieldname === 'blogImage') {
      folder = 'blogs';
    }

    return {
      folder: folder,
      format: file.originalname.split('.').pop(), // Allow the format to match the file extension
      public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '-').toLowerCase()}`, // Unique public ID with timestamp
    };
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // Apply the file filter
}).fields([
  { name: 'productImages', maxCount: 5 },
  { name: 'logo', maxCount: 1 },
  { name: 'customProductImages', maxCount: 10 },
  { name: 'blogImage', maxCount: 1 }
]);

export default upload;
