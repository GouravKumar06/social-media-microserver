const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger")


exports.uploadMedia = async(req,res) => {
    logger.info("starting upload media")
    try{
        console.log("req.file",req.file)
        if(!req.file){
            logger.error("No file found please try again")
            return res.status(400).json({
              success: false,
              message: "No file found please try again",
            });
        }

        const {originalname,mimetype,buffer} = req.file
        const userId = req.user.userId

        logger.info(`file details: name = ${originalname} and type = ${mimetype}`)

        logger.info("uploading file to cloudinary")

        const result = await uploadMediaToCloudinary(req.file)
        logger.info(`file uploaded to cloudinary with public id = ${result.public_id}`)

        const newMedia = new Media({
            userId,
            publicId: result.public_id,
            url: result.secure_url,
            mimeType: mimetype,
            originalName: originalname,
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


exports.getAllMedias = async(req,res) => {
    logger.info("getting all media")
    try{
        // const userId = req.user.userId
        // const medias = await Media.find({userId}).sort({createdAt: -1})
        const medias = await Media.find().sort({createdAt: -1})

        if(!medias || medias.length === 0){
            logger.error("No media found")
            return res.status(404).json({
                success: false,
                message: "No media found",
            })
        }
        
        res.status(200).json({
            success: true,
            message: "All media fetched successfully",
            medias,
        })
    }catch(error){
        logger.error(`Error fetching all media: ${error.message}`)
        res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}