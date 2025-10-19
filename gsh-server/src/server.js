const { config } = require("./config/env");
const { connectMongo } = require("./loaders/mongo");
const { ensureAdmin } = require("./seed/ensureAdmin");
const app = require("./app");

(async () => {
  await connectMongo(config.MONGO_URI);

  await ensureAdmin();

  app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
})();
