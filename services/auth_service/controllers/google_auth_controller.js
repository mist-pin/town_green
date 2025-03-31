require('dotenv').config()
const axios = require('axios');
const { pg_query, get_user_with_mail } = require('../../../utils/pg_db_utils');
const {createAccessToken, createRefreshToken} = require('../../../utils/token')
const {save_refresh_token} = require('./auth_controller')

const google_auth_link = async (req, res) => {
    const googleAuthURL = 'https://accounts.google.com/o/oauth2/v2/auth';
    const authUrl = `${googleAuthURL}?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=email%20profile%20openid&access_type=offline`;
    res.json({ link: authUrl });
}

const google_signin = async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('No code provided');
    }

    GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

    try {
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, null, {
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
                code: code,
            },
        });

        const google_access_token = tokenResponse.data.access_token;
        const google_refresh_token = tokenResponse.data.google_refresh_token;

        // console.log('google_access_token: ',google_access_token, '\ngoogle_refresh_token: ', google_refresh_token);

        // Fetch user info (email)
        GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
        const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${google_access_token}` },
        });

        const mail = userInfoResponse.data.email;

        const user = await get_user_with_mail(mail)
        let msg;
        if (!user) {
            // this is a google-sign-up

            // create user
            await pg_query(`insert into tg_user(mail,mail_verified,role) values($1,$2,$3)`, [mail, true, 'user']);
            user = await get_user_with_mail(mail);
            if (!user) {
                return res.status(500).json({ message: 'User not found internal server error' });
            }
            pg_query("")
            msg = 'User registered successfully'
        } else {
            // this is a google-sign-in
            msg = 'User logged in successfully'

        }
        const token = createAccessToken({ mail: user.mail });
        const refresh_token = createRefreshToken({ mail: user.mail });
        // Respond with tokens and email
        res.json({ token: token, refresh_token: refresh_token, message: msg });
        await save_refresh_token(user, refresh_token)

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ msg: 'Authentication failed' });
    }
}

module.exports = { google_auth_link, google_signin }