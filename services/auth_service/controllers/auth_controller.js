const { pg_query, get_user_with_mail } = require('../../../utils/pg_db_utils');
const { sendMail } = require('../../../utils/mailer');
const { redisClient } = require('../../../utils/redis_db');
const { createAccessToken, createRefreshToken, generateAccessTokenWithRefreshToken, verifyToken } = require('../../../utils/token');
const jwt = require('jsonwebtoken');

// local utility:
async function verify_otp(res, mail, otp) {
    saved_otp = await redisClient.get(String(mail) + '_otp');
    if (saved_otp === null) {
        res.status(401).json({ message: 'OTP expired' });
        return false
    }
    else if (saved_otp !== otp) {
        res.status(401).json({ message: 'invalid OTP' });
        return false
    }
    return true;
}

async function save_refresh_token(user, token) {
    const token_exists = await pg_query("select * from token where user_id=$1", [user.id])
    if (token_exists.rows.length > 0) {
        await pg_query("update token set token = $1 where user_id = $2", [token, user.id]);
    }
    else {
        await pg_query("insert into token(user_id,token) values($1,$2)", [user.id, token])
    }
}





const get_otp = async (req, res) => {
    try {
        let { mail } = req.body;
        if (!mail) {
            res.status(400).json({ message: 'mail is required' });
        }
        let otp = Math.floor(1000 + Math.random() * 9000);
        await redisClient.setEx(String(mail) + '_otp', 300, String(otp));
        await sendMail(mail, 'OTP for registration', `Your OTP for registration is ${otp}`);
        res.json({ msg: 'OTP sent successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ err: error });
    }
};

const signup = async (req, res) => {
    try {
        let { mail, otp } = req.body;
        if (!mail || !otp) {
            res.status(400).json({ message: 'mail and otp are required' });
            return;
        }
        const is_otp_verified = await verify_otp(res, mail, otp);
        if (!is_otp_verified) {
            return;
        }
        // if user exists, then no need to go further
        user = await get_user_with_mail(mail);
        if (user) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // create user
        await pg_query(`insert into tg_user(mail,mail_verified,role) values($1,$2,$3)`, [mail, true, 'user']);
        user = await get_user_with_mail(mail);
        if (!user) {
            res.status(500).json({ message: 'User not found internal server error' });
            return;
        }
        // todo: notify registration_topic using kafka so that other tables can be created or updated

        // token generation
        let token = createAccessToken({ mail: user.mail });
        let refresh_token = createRefreshToken({ mail: user.mail });
        res.json({ token: token, refresh_token: refresh_token, message: 'User registered successfully' });
        await save_refresh_token(user, refresh_token)
    } catch (error) {
        console.error(error)
        res.status(500).json(error);
    }
}

const signin = async (req, res) => {
    `
    signin options:
    1. mail and password
    2. mail and otp
    `
    try {
        let { mail, password, otp } = req.body;
        if (!mail) {
            res.status(400).json({ message: 'mail and password are required' });
            return;
        }

        let user = await get_user_with_mail(mail);
        if (!user) {
            res.status(404).json({ message: 'user hasnot signed-up' });
            return;
        }

        if (otp) {
            const is_otp_verified = await verify_otp(res, mail, otp)
            if (!is_otp_verified) {
                return;
            }
        } else if (password) {
            const saved_pass = ''
            if (password === saved_pass) {
                res.status(401).json({ message: 'invalid password' });
                return
            }
        }
        let token = createAccessToken({ mail: user.mail });
        let refresh_token = createRefreshToken({ mail: user.mail });
        res.json({ token: token, refresh_token: refresh_token, message: 'user logged in successfully' });
        await save_refresh_token(user, refresh_token)
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}

const signout = async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        
        const user_id = user.id;
        // Decode token to get expiry
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return res.status(400).json({ message: "Invalid token" });
        }

        const user = await get_user_with_mail(req.body.user.mail);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate time left for the token to expire
        const token_timeleft = Math.floor(decoded.exp - Date.now() / 1000);

        // Blacklist the access token in Redis (only if it has time left)
        if (token_timeleft > 0) {
            await redisClient.setEx(`${token}blacklisted`, token_timeleft, "blacklisted");
        }

        // Delete refresh token from DB
        await pg_query("DELETE FROM token WHERE user_id=$1", [user_id]);

        res.status(200).json({ message: "Successfully logged out" });

    } catch (err) {
        console.error("Signout error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const new_access_token = async(req,res)=>{
    const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid token format login reqired" });
        }
        if(verifyToken(token)){
            return res.json({token:generateAccessTokenWithRefreshToken(token)})
        }else{
            return res.status(400).json({message:"invalid token, login reqired"})
        }
}



module.exports = { get_otp, signup, signin, signout, new_access_token, save_refresh_token};
