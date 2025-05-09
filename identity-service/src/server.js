require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const indentityRoutes = require('./routes/identity-service');
const errorHandler = require('./middleware/errorHandler');

//local imports
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

//connect to database
connectDB();

const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

//global middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request for ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

//DDOS protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 15,
  duration: 1,
  blockDuration: 180, // block for 180 sec after limit
});

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
    .then(()=>{
        next();
    })
    .catch(err=>{
        logger.warn(`rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Rate limit exceeded..... to many requests"
        });
    })
})


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


//apply this sensitive endpoint rate limit to the registration endpoint
app.use('/api/auth/register', sensitiveEndpointsLimiter);

//routes use 
app.use('/api/auth', indentityRoutes);

//use error handler middleware
app.use(errorHandler);


app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`)
});

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); 
});
