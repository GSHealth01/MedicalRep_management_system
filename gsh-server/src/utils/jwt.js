const jwt = require("jsonwebtoken");
const { config } = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.ACCESS_TTL });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.REFRESH_TTL });
}
function verifyAccess(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
}
function verifyRefresh(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccess, verifyRefresh };
