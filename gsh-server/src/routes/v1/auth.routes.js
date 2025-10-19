const router = require("express").Router();
const { requireAuth } = require("../../middlewares/auth");
const ctrl = require("../../controllers/v1/auth.controller");

// PUBLIC
router.post("/signup", require("../../utils/asyncHandler")(ctrl.signup));
router.post("/signin", require("../../utils/asyncHandler")(ctrl.signin));
router.post("/refresh", require("../../utils/asyncHandler")(ctrl.refresh));

// AUTHENTICATED
router.post("/logout", requireAuth, require("../../utils/asyncHandler")(ctrl.logout));

module.exports = router;
