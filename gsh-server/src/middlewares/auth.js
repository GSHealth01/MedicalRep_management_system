const { verifyAccess } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, email: payload.email, designation: payload.designation || payload.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
