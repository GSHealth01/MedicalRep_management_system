const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/admin/users", require("./admin/users.routes")); 
router.use("/admin/products", require("./admin/products.routes"));
router.use("/admin/doctors",  require("./admin/doctors.routes"));
router.use("/admin/distributors", require("./admin/distributors.routes"));

module.exports = router;
