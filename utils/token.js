const jwt = require('jsonwebtoken');
const { redisClient } = require('./redis_db');

const TOKEN_SECRET = 'your_TOKEN_SECRET';
const ACCESS_TOKEN_EXPIRY = '15m'; // Example: 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // Example: 7 days


// Function to crearte payload
function getPayload(mail) {
    return {
        mail: mail, 
        liam: String(mail).split('').reverse().join('')
    };
}

// Function to create an access token
function createAccessToken(mail) {
    const token = jwt.sign(getPayload(mail), TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    try{
        if (redisClient.get(`${token}blacklisted`)){
            return createAccessToken(mail)
        }
    }catch(err){
        console.log(err)
    }
    return token
}

// Function to create a refresh token
function createRefreshToken(mail) {
    return jwt.sign(getPayload(mail), TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Function to verify an access token
function verifyToken(token,user) {
    try {
        return jwt.verify(token, TOKEN_SECRET);
    } catch (err) {
        return null;
    }
}
// Function to generate a new access token using a refresh token
function generateAccessTokenWithRefreshToken(refreshToken) {
    try {
        const mail = get_mail_from_token(refreshToken);
        return createAccessToken(getPayload(decoded.mail));
    } catch (err) {
        return null;
    }
}

// function to get the mail address from token
function get_mail_from_token(token){
    try{
        const decoded = jwt.verify(token, TOKEN_SECRET);
        return decoded.mail
    }catch(err){
        return null
    }
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    verifyToken,
    generateAccessTokenWithRefreshToken,
    get_mail_from_token
};