const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 300, // allow 500 requests per 15 minutes, then...
    delayMs: 50, // begin adding 50ms of delay per request above 100:
    // request # 101 is delayed by  500ms
    // request # 102 is delayed by 1000ms
    // request # 103 is delayed by 1500ms
    // etc.
});

module.exports = speedLimiter