const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "volunteer-hub", // Tên thư mục trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"], // Định dạng cho phép
    transformation: [{ width: 1000, crop: "limit" }], // (Tùy chọn) Resize ảnh nếu quá to
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
