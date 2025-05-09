const joi = require('joi');


const validateRegistration = (data) => {
    const schema = joi.object({
        username: joi.string().min(5).max(40).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(1024).required(),
        role: joi.string().valid('user', 'admin').default('user')
    });

    return schema.validate(data);
}


module.exports = { validateRegistration };