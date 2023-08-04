const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");
const authenticate = require("../middleware/authenticate");

router.route("/").get(userController.index);
router.route("/register").post(userController.register);
router.route("/login").post(userController.login);

router.route("/:userId").get(authenticate, userController.getUserProjects);

router
  .route("/project/:projectId")
  .get(authenticate, userController.getSingleProject);


  router
  .route("/task/:taskId")
  .get(authenticate, userController.getSingleTask);

router.route("/add-project").post(authenticate, userController.addNewProject);
router.route("/add-task").post(authenticate, userController.addNewTask);
router.route("/edit-task/").put(authenticate, userController.updateTask);


module.exports = router;
