require('dotenv').config();
const logger = require("../utils/logger")
const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        logger.warn("Access denied. No token provided.");
        return res.status(401).json({
            success: false,
            message: "No token provided",
        });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        req.user = user;
        next();
    });
}

module.exports = {
    validateToken,
};