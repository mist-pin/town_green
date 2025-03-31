const Mail = require("nodemailer/lib/mailer");
const { verifyToken, get_mail_from_token } = require("../../utils/token");
const { pg_query, get_user_with_mail } = require("../../utils/pg_db_utils");

const authorize = async (req, res, next) => {
    // reject_return if user loggedout, verification failed
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }
    if (verifyToken(token)) {
        try {
            if (redisClient.get(`${token}blacklisted`)) {
                return res.status(401).json({ message: "Unauthorized. Please log in." })
            }
        } catch (err) {
            console.log(err)
        }
        try{
            const mail = get_mail_from_token(token);
            if(!mail){
                return res.status(500).json({message:"tampered token found"})
            }
            user = get_user_with_mail(mail)
            if(!user){
                return res.status(500).json({message:"user not found in database"})
            }
            req.body.user = user;
        }catch(err){console.log(err)}
        next()
    }
    else {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
}


module.exports = { authorize }