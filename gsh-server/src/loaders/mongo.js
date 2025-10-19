const mongoose = require("mongoose");

async function connectMongo(uri) {
  await mongoose.connect(uri);
  console.log("Mongo connected");
}

module.exports = { connectMongo };
