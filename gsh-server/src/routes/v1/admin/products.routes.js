const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/products.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// All product admin routes → require ADMIN
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(ctrl.list));                 // list + filters + pagination
router.post("/", asyncHandler(ctrl.create));              // create
router.get("/:id", asyncHandler(ctrl.getOne));            // view
router.patch("/:id", asyncHandler(ctrl.update));          // edit details
router.patch("/:id/status", asyncHandler(ctrl.updateStatus)); // activate/deactivate
router.delete("/:id", asyncHandler(ctrl.remove));         // remove (hard delete)

module.exports = router;
