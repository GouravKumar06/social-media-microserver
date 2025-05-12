const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger")


exports.uploadMedia = async(req,res) => {
    logger.info("starting upload media")
    try{
        if(!req.file){
            logger.error("No file found please try again")
            return res.status(400).json({
              success: false,
              message: "No file found please try again",
            });
        }

        const {originalName,mimeType,buffer} = req.file
        const userId = req.user.userId

        logger.info(`file details: name = ${originalName} and type = ${mimeType} with buffer = ${buffer}`)

        logger.info("uploading file to cloudinary")

        const result = await uploadMediaToCloudinary(req.file)
        logger.info(`file uploaded to cloudinary with public id = ${result.public_id}`)

        const newMedia = new Media({
            userId,
            publicId: result.public_id,
            url: result.secure_url,
            mimeType,
            originalName
        })

        await newMedia.save()

        res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            mediaId : newMedia._id,
            url: newMedia.url,
        })
    }catch(error){
        logger.error(`Error uploading file: ${error.message}`)
        res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}