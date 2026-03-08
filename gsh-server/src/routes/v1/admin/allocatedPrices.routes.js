const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/allocatedPrices.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// Public read endpoints for authenticated users (to get their own allocated prices)
router.get("/by-designation-code/:designationCode", requireAuth, asyncHandler(ctrl.getByDesignationCode));

// ADMIN-only
router.use(requireAuth, requireRole("ADMIN", "OM"));

router.get("/", asyncHandler(ctrl.list));
router.get("/designations", asyncHandler(ctrl.getDesignations));
router.get("/by-designation/:designation", asyncHandler(ctrl.getByDesignation));
router.post("/", asyncHandler(ctrl.create));
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
