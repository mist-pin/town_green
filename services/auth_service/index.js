require('dotenv').config();

const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const { get_otp, signup, signin, signout, new_access_token} = require('./controllers/auth_controller.js');
const {google_auth_link, google_signin} = require('./controllers/google_auth_controller.js')
const {get_private_profile, put_private_profile, get_dp} = require('./controllers/profile_controller.js')
const { pool } = require('../../utils/pg_db_utils.js');
const {authorize} = require('./middleware.js')

// multer
const uploadDir = path.join(__dirname, 'uploads/dps');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// auth/routes:
router.route('/get-otp/').post(get_otp)
router.route('/signup').post(signup)
router.route('/signin').post(signin)
router.route('/google').get(google_auth_link)
router.route('/google/callback').get(google_signin)
router.route('/signout').get(authorize, signout)
router.route('/access_token').get(new_access_token)
router.route('/profile',authorize).get(get_private_profile).put(upload.single('dp'),put_private_profile)
router.route('/profile/dp/:file', authorize).get(get_dp)

// router.route('/profile/:id',authorize).get() //profile view for public


// create all tables:
const { create } = require('./model.js');
create();


module.exports = router;