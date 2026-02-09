const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/chemists.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// ADMIN-only
router.use(requireAuth, requireRole("ADMIN", "OM"));

router.get("/", asyncHandler(ctrl.list));
router.post("/", asyncHandler(ctrl.create));
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.put("/:id", asyncHandler(ctrl.updatePut));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
