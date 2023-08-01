const userData = require("../seed-data/users");
const projectData = require("../seed-data/projects");
const taskData = require("../seed-data/tasks");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex("user").del();
  await knex("user").insert(userData);
  await knex("projects").del();
  await knex("projects").insert(projectData);
  await knex("tasks").del();
  await knex("tasks").insert(taskData);
};
