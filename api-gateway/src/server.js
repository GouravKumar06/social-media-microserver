require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const proxy = require('express-http-proxy');

//local imports
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');


const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

app.use(helmet());
app.use(cors());
app.use(express.json());


// Rate limiting middleware
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Rate limit exceeded..... to many requests"
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
})

app.use(rateLimiter);

// Middleware to log requests
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} by IP: ${req.ip} to URL: ${req.url}`);
    next();
});

// i want to change my url localhost:3000/v1/auth/register to localhost:3001/api/auth/register
// Proxy routes to respective services
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Bad Gateway..... Service Unavailable",
            error: err.message
        });
    },
};

//setting up the proxy for our identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity Service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler)


app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`identity service url: ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`redis url: ${process.env.REDIS_URL}`);
});