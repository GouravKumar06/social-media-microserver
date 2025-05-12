const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Mongo DB database connected successfully');
        logger.info("Mongo DB database connected successfully");
    } catch (error) {
        console.log('DB connection error', error);
        logger.error('DB connection error', error);
        process.exit(1);
    }
}

module.exports = connectDB