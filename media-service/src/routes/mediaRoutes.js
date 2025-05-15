

const express = require('express');
const multer = require('multer');
const {uploadMedia, getAllMedias} = require('../controllers/mediaController');
const isAuthenticated = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const router = express.Router();

//configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 10 MB limit
    }
}).single('file');

// Middleware to handle file upload
const uploadFile = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error(`Multer error: ${err.message}`);
            return res.status(400).json({
                stack: err.stack,
                message: "File upload failed",
                error: err.message
            });
        }else if (err) {
            logger.error(`Unknown error: ${err.message}`);
            return res.status(500).json({
              stack: err.stack,
              message: "Unknown error... File upload failed",
              error: err.message,
            });
        }

        if (!req.file) {
            logger.error("No file found");
            return res.status(400).json({
                message: "No file found",
                error: "No file found"
            });
        }
        next();
    });
};

router.post("/upload", isAuthenticated, uploadFile, uploadMedia);
router.get("/all-media",isAuthenticated,getAllMedias)

module.exports = router