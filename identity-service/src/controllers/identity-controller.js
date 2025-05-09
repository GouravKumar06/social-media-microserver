const User = require('../models/User');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration } = require('../utils/validation');
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
            refreshToken
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

//refresh token

//logout
