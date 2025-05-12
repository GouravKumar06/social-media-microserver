require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "media-service",
      },
      (error, result) => {
        if (error) {
          logger.error(`Error uploading file to Cloudinary: ${error.message}`);
           reject(error);
        }
        resolve(result);
      }
    );

    // Pipe buffer to stream
    uploadStream.end(file.buffer)
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting file from Cloudinary: ${error.message}`);
    throw error;
  }
}

module.exports = {uploadMediaToCloudinary,deleteMediaFromCloudinary}