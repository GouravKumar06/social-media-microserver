const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration, validateLogin } = require("../utils/validation");

//registration
exports.registerUser = async (req, res) => {
    logger.info('registration endpoint.......');
    try{
        const {error} = validateRegistration(req.body);
        if(error){
            logger.warn('validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const {username, email, password,role} = req.body;

        let user = await User.findOne({
            $or : [
                {username},
                {email}
            ]
        })

        if(user){
            logger.warn('user already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        user = new User({
            username,
            email,
            password,
            role
        });

        await user.save();

        logger.info('user registered successfully',user._id);

        const {accessToken, refreshToken} = await generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken,
        });

    }catch(error){
        logger.error("Registration error",error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}


//login
exports.loginUser = async (req, res) => {
    logger.info('login endpoint.......');
    try{
        const { error } = validateLogin(req.body);
        if(error){
            logger.warn('validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const {email, password} = req.body;

        let user = await User.findOne({ email });

        if(!user){
            logger.warn('user not found');
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await user.comparePassword(password);

        if(!isMatch){
            logger.warn('invalid credentials');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const {accessToken, refreshToken} = await generateTokens(user);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            accessToken,
            refreshToken,
            userId : user._id,
        });

    }catch(error){
        logger.error("Login error",error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

//refresh token
exports.tokenController = async (req, res) => {
    logger.info('refresh token endpoint.......');
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            logger.warn('refresh token not found');
            return res.status(400).json({
                success: false,
                message: 'Refresh token not found'
            });
        }

        const oldRefreshtoken = await RefreshToken.findOne({token: refreshToken});

        if (!oldRefreshtoken || oldRefreshtoken.expiresAt < Date.now()) {
          logger.warn("invalid old refresh token");
          return res.status(400).json({
            success: false,
            message: "Invalid old refresh token",
          });
        }

        const user = await User.findById(oldRefreshtoken.user);

        if(!user){
            logger.warn('user not found');
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        const {accessToken: newAccessToken , refreshToken: newRefreshToken} = await generateTokens(user);

        //delete old refresh token
        await RefreshToken.deleteOne({ _id: oldRefreshtoken._id });

        res.status(200).json({
            success: true,
            message: 'Tokens generated successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    }catch(error){
        logger.error("Refresh token error: ",error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

//logout
exports.logoutUser = async (req, res) => {
    logger.info('logout endpoint.......');
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            logger.warn('refresh token not found');
            return res.status(400).json({
                success: false,
                message: 'Refresh token not found'
            });
        }

        //delete old refresh token
        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info('user logged out successfully');

        res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });

    }catch(error){
        logger.error("Logout error: ",error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
}
