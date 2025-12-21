const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file nào được tải lên" });
    }

    // Cloudinary trả về đường dẫn ảnh trong req.file.path
    // Đường dẫn này là tuyệt đối (https://res.cloudinary.com/...)
    res.json({
      message: "Upload thành công",
      url: req.file.path,
    });
  } catch (error) {
    console.error("Lỗi upload:", error);
    res.status(500).json({ message: "Lỗi khi tải lên hình ảnh" });
  }
});

module.exports = router;
