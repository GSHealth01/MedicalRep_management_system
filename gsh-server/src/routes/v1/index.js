const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/debug", require("./debug.routes"));
router.use("/agencies", require("./agency.routes"));
// router.use("/ranges", require("./range.routes"));
router.use("/areas", require("./area.routes"));
router.use("/teams", require("./team.routes"));
router.use("/doctors", require("./doctor.routes"));
router.use("/itineraries", require("./itinerary.routes"));
router.use("/products", require("./product.routes"));
// router.use("/distributors", require("./distributor.routes"));
router.use("/users", require("./user.routes"));
router.use("/admin/users", require("./admin/users.routes"));
router.use("/admin/products", require("./admin/products.routes"));
router.use("/admin/doctors", require("./admin/doctors.routes"));
router.use("/admin/distributors", require("./admin/distributors.routes"));
router.use("/admin/sectors", require("./admin/sectors.routes"));
router.use("/admin/subsectors", require("./admin/subsectors.routes"));
router.use("/admin/teams", require("./admin/teams.routes"));

module.exports = router;
