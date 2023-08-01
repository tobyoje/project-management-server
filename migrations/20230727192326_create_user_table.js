/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("user", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("username").notNullable();
      table.string("position").notNullable();
      table.string("email").notNullable();
      table.string("password").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
    .createTable("projects", (table) => {
      table.increments("id").primary();
      table.string("project_name").notNullable();
      table.string("project_description", 1000).notNullable();
      table.string("project_priority").notNullable();
      table.timestamp("project_startdate").notNullable();
      table.timestamp("project_enddate").notNullable();
      table.integer("favorite").notNullable().defaultTo(0);
      table
        .integer("user_id")
        .unsigned()
        .references("user.id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
    .createTable("tasks", (table) => {
      table.increments("id").primary();
      table.string("task_name").notNullable();
      table.string("task_priority").notNullable();
      table.string("task_category").notNullable();
      table.timestamp("task_startdate").notNullable();
      table.timestamp("task_enddate").notNullable();
      table
        .integer("project_id")
        .unsigned()
        .references("projects.id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("tasks").dropTable("projects").dropTable("user");
};
