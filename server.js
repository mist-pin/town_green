require('dotenv').config();

const express = require('express');

const router = express.Router()
const app = express();
app.use(express.json());    


// setup db


// api_gateway_routes:
app.get('/',(req, res) => {res.json({ message: "running brooo" });});
app.use('/auth',require('./services/auth_service/index.js'))



app.use(router);
app.listen(5000, () => {
  console.log(`server started`);
})