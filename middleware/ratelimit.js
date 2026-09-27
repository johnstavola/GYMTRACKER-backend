const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                     // limit each IP to 5 attempts per minute
  message: { error: "Too many attempts, try again later" },
  standardHeaders: true,      // include rate limit info in response headers
  legacyHeaders: false        // disable old X-RateLimit headers
});

module.exports = authLimiter;
