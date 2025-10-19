const router = require("express").Router();
router.use("/auth", require("./auth.routes"));
router.use("/admin/users", require("./admin/users.routes")); // ADMIN controllers
router.use("/admin/products", require("./admin/products.routes"));
module.exports = router;
