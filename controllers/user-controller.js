const knex = require("knex")(require("../knexfile"));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const index = (req, res) => {
  knex("user")
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => res.status(400).send(`Error retrieving users: ${err}`));
};

//Account Sign Up
const register = async (req, res) => {
  const { name, position, email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .send("Please provide required information in the request");
  }

  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!email.match(mailformat)) {
    return res.status(400).send("Please provide a valid email");
  }

  const hashedPassword = bcrypt.hashSync(password);

  function generateRandomAlphaNumeric(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }

  let genUsername = name.split(" ");
  const randomString = generateRandomAlphaNumeric(5);
  const modifiedUsername = genUsername[0] + randomString;
  genUsername = modifiedUsername;

  try {
    const existingEmailUser = await knex("user").where({ email }).first();
    if (existingEmailUser) {
      return res.status(409).send("Email already exists");
    }

    const existingUsernameUser = await knex("user")
      .where({ username: genUsername })
      .first();
    if (existingUsernameUser) {
      return res.status(409).send("Username already exists");
    }

    const newUser = {
      name,
      username: genUsername,
      position,
      email,
      password: hashedPassword,
    };

    await knex("user").insert(newUser);
    res.status(201).send("Registered successfully");
  } catch (error) {
    console.log(error);
    res.status(400).send("Unable to create new user");
  }
};

// Account Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please enter the required fields");
  }

  try {
    const user = await knex("user").where({ email }).first();

    if (!user) {
      return res.status(400).send("Invalid email");
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).send("Invalid password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    console.log("User logged in: ", user.id);

    res.json({
      token,
      user_id: user.id,
    });
  } catch (error) {
    console.error("Login failed: ", error);
    res.status(500).json({ error: "Login failed" });
  }
};

const getUserProjects = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await knex("user").where("id", userId).first();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const projects = await knex("projects")
      .where("user_id", userId)
      .select(
        "id as project_id",
        "project_name",
        "project_description",
        "project_priority",
        "project_startdate",
        "project_enddate",
        "favorite"
      );

    for (const project of projects) {
      const tasks = await knex("tasks")
        .where("project_id", project.project_id)
        .select(
          "id as task_id",
          "task_name",
          "task_priority",
          "task_category",
          "task_startdate",
          "task_enddate"
        );

      project.tasks = tasks;
    }

    res.status(200).json({ user, projects });
  } catch (error) {
    console.error("Failed to get user tasks and projects: ", error);
    res.status(500).json({ error: "Failed to get user tasks and projects" });
  }
};

const getSingleProject = async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const projects = await knex("projects")
      .where("id", projectId)
      .select(
        "id as project_id",
        "project_name",
        "project_description",
        "project_priority",
        "project_startdate",
        "project_enddate",
        "favorite"
      )
      .first();

    if (!projects) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tasks = await knex("tasks")
      .where("project_id", projectId)
      .select(
        "id as task_id",
        "task_name",
        "task_priority",
        "task_category",
        "task_startdate",
        "task_enddate"
      );

    projects.tasks = tasks;

    res.status(200).json({ project: projects });
  } catch (error) {
    console.error("Failed to get project and tasks: ", error);
    res.status(500).json({ error: "Failed to get project and tasks" });
  }
};

const getSingleTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await knex("tasks")
      .where("id", taskId)
      .select(
        "id as task_id",
        "task_name",
        "task_priority",
        "task_category",
        "task_startdate",
        "task_enddate"
      )
      .first();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error("Failed to get task: ", error);
    res.status(500).json({ error: "Failed to get task" });
  }
};

const addNewProject = async (req, res) => {
  const {
    project_name,
    project_description,
    project_priority,
    project_startdate,
    project_enddate,
  } = req.body;

  if (
    !project_name ||
    !project_description ||
    !project_priority ||
    !project_startdate ||
    !project_enddate
  ) {
    return res
      .status(400)
      .send("Please provide required information in the request");
  }

  const existingUser = await knex("user").where({ id: req.user.id }).first();
  if (!existingUser) {
    return res.status(404).send("User not found");
  }

  const existingProject = await knex("projects")
    .where({ user_id: req.user.id, project_name })
    .first();

  if (existingProject) {
    return res
      .status(409)
      .send("A project with the same name already exists for this user");
  }

  const newProject = {
    project_name,
    project_description,
    project_priority,
    project_startdate,
    project_enddate,
    user_id: existingUser.id,
  };

  try {
    await knex("projects").insert(newProject);

    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding the project", error: error.message });
  }
};

const updateProject = async (req, res) => {
  const {
    project_name,
    project_priority,
    project_description,
    project_startdate,
    project_enddate,
    project_id,
  } = req.body;

  if (
    !project_name ||
    !project_description ||
    !project_priority ||
    !project_startdate ||
    !project_enddate ||
    !project_id
  ) {
    return res
      .status(400)
      .send("Please provide required information in the request");
  }

  const existingUser = await knex("user").where({ id: req.user.id }).first();
  if (!existingUser) {
    return res.status(404).send("User not found");
  }

  try {
    const existingProject = await knex("projects")
      .where({ id: project_id, user_id: req.user.id })
      .first();

    if (!existingProject) {
      return res.status(404).send("Project not found for this user");
    }

    const updatedProject = {
      project_name,
      project_description,
      project_priority,
      project_startdate,
      project_enddate,
    };

    await knex("projects")
      .where({ id: project_id, user_id: req.user.id })
      .update(updatedProject);

    const tasks = await knex("tasks").where({ project_id });

    res.status(200).json({
      message: "Project updated successfully",
      project_description,
      project_enddate,
      project_id,
      project_name,
      project_priority,
      project_startdate,
      tasks: tasks,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating the project", error: error.message });
  }
};

const addNewTask = async (req, res) => {
  const {
    task_name,
    task_priority,
    task_category,
    task_startdate,
    task_enddate,
    project_id,
  } = req.body;

  if (
    !task_name ||
    !task_priority ||
    !task_category ||
    !task_startdate ||
    !task_enddate ||
    !project_id
  ) {
    return res
      .status(400)
      .send("Please provide required information in the request");
  }

  const existingUser = await knex("user").where({ id: req.user.id }).first();
  if (!existingUser) {
    return res.status(404).send("User not found");
  }

  const existingProject = await knex("projects")
    .where({ id: project_id, user_id: req.user.id })
    .first();

  if (!existingProject) {
    return res
      .status(404)
      .send("Project not found for this user with the given project_id");
  }

  const newTask = {
    task_name,
    task_priority,
    task_category,
    task_startdate,
    task_enddate,
    project_id: existingProject.id,
  };

  try {
    await knex.transaction(async (trx) => {
      await trx("tasks").insert(newTask);

      const tasks = await trx("tasks").where({
        project_id: existingProject.id,
      });

      const response = {
        message: "Task created successfully",
        task: newTask,
        project_description: existingProject.project_description,
        project_enddate: existingProject.project_enddate,
        project_id: existingProject.id,
        project_name: existingProject.project_name,
        project_priority: existingProject.project_priority,
        project_startdate: existingProject.project_startdate,
        tasks: tasks,
      };

      res.status(201).json(response);
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding the task", error: error.message });
  }
};

const updateTask = async (req, res) => {
  const {
    task_name,
    task_priority,
    task_category,
    task_startdate,
    task_enddate,
    task_id,
  } = req.body;

  if (
    !task_name ||
    !task_priority ||
    !task_category ||
    !task_startdate ||
    !task_enddate ||
    !task_id
  ) {
    return res
      .status(400)
      .send("Please provide required information in the request");
  }

  const existingUser = await knex("user").where({ id: req.user.id }).first();
  if (!existingUser) {
    return res.status(404).send("User not found");
  }

  try {
    const taskToUpdate = await knex("tasks").where({ id: task_id }).first();

    if (!taskToUpdate) {
      return res.status(404).send("Task not found with the given task_id");
    }

    const existingProject = await knex("projects")
      .where({ id: taskToUpdate.project_id, user_id: req.user.id })
      .first();

    if (!existingProject) {
      return res
        .status(404)
        .send("Project not found for this user with the associated task");
    }

    const updatedTask = {
      task_name,
      task_priority,
      task_category,
      task_startdate,
      task_enddate,
      project_id: existingProject.id,
    };

    await knex.transaction(async (trx) => {
      await trx("tasks").where({ id: task_id }).update(updatedTask);

      const tasks = await trx("tasks").where({
        project_id: existingProject.id,
      });

      const response = {
        message: "Task updated successfully",
        task: { task_id: task_id, ...updatedTask },
        project_description: existingProject.project_description,
        project_enddate: existingProject.project_enddate,
        project_id: existingProject.id,
        project_name: existingProject.project_name,
        project_priority: existingProject.project_priority,
        project_startdate: existingProject.project_startdate,
        tasks: tasks.map((task) => ({ task_id: task.id, ...task })),
      };

      res.status(200).json(response);
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating the task", error: error.message });
  }
};

module.exports = {
  index,
  register,
  login,
  getUserProjects,
  getSingleProject,
  getSingleTask,
  addNewProject,
  updateProject,
  addNewTask,
  updateTask,
};
