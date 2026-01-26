function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthenticated" });
    if (!roles.includes(req.user.designation)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}
module.exports = { requireRole };
