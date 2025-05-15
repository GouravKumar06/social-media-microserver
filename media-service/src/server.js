require('dotenv').config();
const express = require('express');
const cors  = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');


//local imports
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const mediaRoutes = require('./routes/mediaRoutes');
const connectDB = require('./config/db');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandlers/mediaHandler');

//connect to database
connectDB();


const app = express();
const PORT = process.env.PORT || 3003;

//connect to redis
const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));


//global middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} by IP: ${req.ip} to URL: ${req.url}`);
    next();
});

// Middleware to handle errors
app.use(errorHandler);


//IP based rate limit for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
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


app.use('/api/media',(req,res,next)=>{
    req.redisClient = redisClient;
    next();
}, mediaRoutes);


async function startServer() {
    try {
        //connect to rabbitMQ
        await connectRabbitMQ();

        //consume event from rabbitMQ
        await consumeEvent('post.deleted',handlePostDeleted);


        app.listen(PORT);
        logger.info(`Media service is running on port ${PORT}`);
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
}

startServer();


process.on('unhandledRejection', (err,promise) => {
    logger.error(`Unhandled Rejection at : ${promise} reason: ${err.message}`);
    process.exit(1);
});

