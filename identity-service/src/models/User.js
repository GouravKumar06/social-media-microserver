const mongoose = require('mongoose');
const argon2 = require('argon2');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
},{timestamps: true});

userSchema.pre('save', async function(next) {
    if(this.isModified('password')) {
        try{
            this.password = await argon2.hash(this.password);
            return next();
        }catch(erroe) {
            return next(error)
        }
    }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    try{
        return await argon2.verify(this.password, candidatePassword);
    }catch(error) {
        throw error
    }
}


userSchema.index({username:'text'});

module.exports = mongoose.model('User', userSchema);

