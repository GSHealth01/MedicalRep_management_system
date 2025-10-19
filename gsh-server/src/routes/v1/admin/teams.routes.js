const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/teams.controller");
const asyncHandler = require("../../../utils/asyncHandler");

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.patch("/:id/status", asyncHandler(ctrl.updateStatus));
router.patch("/:id/members", asyncHandler(ctrl.addMembers));
router.patch("/:id/members/remove", asyncHandler(ctrl.removeMembers));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
