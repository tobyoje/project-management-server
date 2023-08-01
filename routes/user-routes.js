const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

router.route("/").get(userController.index);
router.route("/register").post(userController.register);
router.route("/login").post(userController.login);

router.route("/:userId").get(userController.getUserProjects);

module.exports = router;