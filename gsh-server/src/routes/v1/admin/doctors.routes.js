const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/doctors.controller");
const asyncHandler = require("../../../utils/asyncHandler");

// ADMIN-only
router.use(requireAuth, requireRole("ADMIN", "OM"));

router.get("/",        asyncHandler(ctrl.list));         // list/filter/paginate
router.post("/",       asyncHandler(ctrl.create));       // create
router.get("/:id",     asyncHandler(ctrl.getOne));       // view
router.patch("/:id",   asyncHandler(ctrl.update));       // update details
router.put("/:id",     asyncHandler(ctrl.updatePut));    // update details (PUT alias)
router.patch("/:id/status", asyncHandler(ctrl.updateStatus)); // activate/deactivate
router.delete("/:id",  asyncHandler(ctrl.remove));       // remove

module.exports = router;
