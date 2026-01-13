const router = require("express").Router();
const productsController = require("../../controllers/v1/product.controller");

router.get("/", productsController.list);

module.exports = router;