const router = require("express").Router();
const { requireAuth } = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/requireRole");
const ctrl = require("../../../controllers/v1/admin/subsectors.controller");
const teamCtrl = require("../../../controllers/v1/admin/teams.controller");
const asyncHandler = require("../../../utils/asyncHandler");

router.use(requireAuth, requireRole("ADMIN"));

// nested under sector for create/list
router.get("/sector/:sectorId", asyncHandler(ctrl.listBySector));
router.post("/sector/:sectorId", asyncHandler(ctrl.createUnderSector));

// direct ops on a single sub-sector
router.get("/:id", asyncHandler(ctrl.getOne));
router.patch("/:id", asyncHandler(ctrl.update));
router.patch("/:id/status", asyncHandler(ctrl.updateStatus));
router.delete("/:id", asyncHandler(ctrl.remove));

// teams under a sub-sector
router.get("/:subSectorId/teams", asyncHandler(teamCtrl.list));
router.post("/:subSectorId/teams", asyncHandler(teamCtrl.createUnderSubSector));

module.exports = router;
