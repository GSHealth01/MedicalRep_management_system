const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const v1Routes = require("./routes/v1");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Serve static files for uploads
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

app.use("/api/v1", v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
