const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/sectors.controller");
const asyncHandler = require("../../../utils/asyncHandler");

router.use(requireAuth, requireRole("ADMIN", "OM"));

router.get("/", asyncHandler(ctrl.list));
router.post("/", asyncHandler(ctrl.create));
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.patch("/:id/status", asyncHandler(ctrl.updateStatus));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
