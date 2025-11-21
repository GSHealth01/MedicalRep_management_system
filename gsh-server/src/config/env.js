const config = {
  DATABASE_URL: "postgresql://postgres:admin1@localhost:5432/med_rep_db?schema=public",
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_here",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "your_jwt_access_secret_here",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_here",
  ACCESS_TTL: process.env.ACCESS_TTL || "15m",
  REFRESH_TTL: process.env.REFRESH_TTL || "7d",
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gshealth.lk",
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || "rashini@gshealth.lk",
  EMAIL_PASS: process.env.EMAIL_PASS || "your-password"
};

module.exports = { config };