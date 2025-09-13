import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures');
    console.log('Upload destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `${req.user.id}-${uniqueSuffix}${fileExtension}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  console.log('File filter - mimetype:', file.mimetype, 'originalname:', file.originalname);
  
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      console.log('File accepted');
      cb(null, true);
    } else {
      console.log('File rejected - invalid extension');
      cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
    }
  } else {
    console.log('File rejected - not an image');
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export default upload;
