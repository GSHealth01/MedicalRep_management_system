const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/admin/users", require("./admin/users.routes"));
router.use("/admin/products", require("./admin/products.routes"));
router.use("/admin/doctors", require("./admin/doctors.routes"));
router.use("/admin/distributors", require("./admin/distributors.routes"));
router.use("/admin/sectors", require("./admin/sectors.routes"));
router.use("/admin/subsectors", require("./admin/subsectors.routes"));
router.use("/admin/teams",       require("./admin/teams.routes"));

module.exports = router;
