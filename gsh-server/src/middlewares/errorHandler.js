const notFound = (_req, res, _next) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
