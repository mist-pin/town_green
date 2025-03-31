require('dotenv').config();

const redis = require('redis');

const redisClient = redis.createClient();

// redisClient.on('connect', () => {
//     console.log('Connected to Redis');
// });

// redisClient.on('error', (err) => {
//     console.error('Redis error:', err);
// });

(async () => {
    await redisClient.connect();
    // console.log('Redis client is ready');
})();

module.exports = { redisClient };