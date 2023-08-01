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
  const { email, password } = req.body;

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

  const newUser = {
    email,
    password: hashedPassword,
  };

  try {
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

    // Avoid logging the token, as it may contain sensitive information
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






// Get all user projects and tasks
const getUserProjects = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch user details based on userId
    const user = await knex("user").where("id", userId).first();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch all projects and their associated tasks for the given user ID
    const projects = await knex("projects")
      .where("user_id", userId)
      .select("id as project_id", "project_name", "project_description", "project_priority", "project_startdate", "project_enddate", "favorite");

    for (const project of projects) {
      const tasks = await knex("tasks")
        .where("project_id", project.project_id)
        .select("id as task_id", "task_name", "task_priority", "task_category", "task_startdate", "task_enddate");

      project.tasks = tasks;
    }

    res.status(200).json({ user, projects });
  } catch (error) {
    console.error("Failed to get user tasks and projects: ", error);
    res.status(500).json({ error: "Failed to get user tasks and projects" });
  }
};


module.exports = {
  index,
  register,
  login,
  getUserProjects,
};
