const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/distributors.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// ADMIN-only
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(ctrl.list));
router.post("/", asyncHandler(ctrl.create));
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.put("/:id", asyncHandler(ctrl.updatePut));
router.patch("/:id/status", asyncHandler(ctrl.updateStatus));
router.patch("/:id/assign", asyncHandler(ctrl.assign));     // assign PM/TM/SE
router.patch("/:id/unassign", asyncHandler(ctrl.unassign)); // unassign PM/TM/SE
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
