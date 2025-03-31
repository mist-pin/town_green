require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendMail = async (to, sub, msg) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL,
      to: to,
      subject: sub,
      text: msg,
    });
    console.log('Email sent: ' + info.response);
  } catch (error) {
    throw error;
  }
};

module.exports = { sendMail };