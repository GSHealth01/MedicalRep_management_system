const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/teams.prisma.controller");
const asyncHandler = require("../../../utils/asyncHandler");

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(ctrl.list));
router.post("/", asyncHandler(ctrl.create));
router.get("/:id", asyncHandler(ctrl.getOne));
router.put("/:id", asyncHandler(ctrl.update));
router.put("/:id/leader", asyncHandler(ctrl.setLeader));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
