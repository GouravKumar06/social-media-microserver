require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');



//local imports
const postRoutes = require('./routes/postRoutes');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./utils/rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;

//connect to mongoDB
connectDB();

//global middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());


// Middleware to log requests
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} by IP: ${req.ip} to URL: ${req.url}`);
    next();
});
// Middleware to handle errors
app.use(errorHandler);

//connect to redis
const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));


//IP based rate limit for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Rate limit exceeded..... to many requests"
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

// Rate limiting middleware
app.use(sensitiveEndpointsLimiter);


//post routes -> pass redis client to routes
app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);


async function startServer() {
    try {
        await connectRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Post service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
}

//start the server
startServer();

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1); 
  });