const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
});

module.exports = rateLimiter