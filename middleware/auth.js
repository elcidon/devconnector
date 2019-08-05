const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = (req, res, next) => {
  // Get token from the header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    return res
      .status(401)
      .json({ errors: { msg: "No token, authorization denied." } });
  }
  try {
    // Verify token
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ errors: { msg: "Token isn't valid." } });
  }
};
