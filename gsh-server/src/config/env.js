require("dotenv").config();

const config = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/yourdb",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev-access",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh",
  ACCESS_TTL: process.env.ACCESS_TTL || "15m",
  REFRESH_TTL: process.env.REFRESH_TTL || "7d"
};

module.exports = { config };
