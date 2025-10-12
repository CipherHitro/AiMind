const jwt = require('jsonwebtoken')
require('dotenv').config();
const secret = process.env.secret;

function setUser(user){
    return jwt.sign(
        {
            _id: user._id,
            username:user.username,
            email:user.email,
        },
        secret
    )
}

function getUser(token){
    if(!token){
        return null;
    }
    try{
        return jwt.verify(token , secret);
    }
    catch {
        return null
    }
}

module.exports = {
    setUser,
    getUser
}