const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/users.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// All below are Admin-only
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(ctrl.list));   
router.get("/agency/:agencyId", ctrl.listByAgency);              // AdminController.list
router.post("/", asyncHandler(ctrl.create));              // AdminController.create
router.get("/:id", asyncHandler(ctrl.getOne));            // AdminController.getOne
router.patch("/:id/role", asyncHandler(ctrl.updateRole)); // AdminController.updateRole
router.patch("/:id", asyncHandler(ctrl.updateProfile));   // AdminController.updateProfile
router.put("/:id", asyncHandler(ctrl.updateProfile));     // AdminController.updateProfile (PUT alias)
router.delete("/:id", asyncHandler(ctrl.remove));         // AdminController.remove

module.exports = router;
