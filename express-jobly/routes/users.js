/**The provided JavaScript file, users.js, defines routes for handling HTTP requests related to user data in an Express.js application. Below is a detailed documentation of this file:

Overview
This file is part of an Express.js web application that manages user data.
It uses the User model for database operations and jsonschema for validating request bodies.
Middleware functions ensureCorrectUserOrAdmin and ensureAdmin are used for authentication and authorization.
Routes
POST /

Function: Adds a new user. This is not a registration endpoint but for admin users to add new users.
Request Body: Expected to contain user data.
Response: Returns the newly created user and an authentication token.
Authorization: Admin rights required.
Validation: Uses userNewSchema to validate the request body.
GET /

Function: Returns a list of all users.
Response: List of users, each with username, firstName, lastName, email.
Authorization: Admin rights required.
GET /[username]

Function: Returns data about a specific user.
URL Parameters: username of the user.
Response: User data including username, firstName, lastName, isAdmin, and jobs.
Authorization: Either the same user as username or an admin.
PATCH /[username]

Function: Updates data for a specific user.
URL Parameters: username of the user to update.
Request Body: Can include firstName, lastName, password, email.
Response: Updated user data.
Authorization: Either the same user as username or an admin.
Validation: Uses userUpdateSchema to validate the request body.
DELETE /[username]

Function: Deletes a specific user.
URL Parameters: username of the user to delete.
Response: Confirmation of deletion.
Authorization: Either the same user as username or an admin.
POST /[username]/jobs/[id]

Function: Allows a user to apply for a job.
URL Parameters: username of the user and id of the job.
Request Body: Expected to contain the application state.
Response: Confirmation of the job application.
Authorization: Either the same user as username or an admin.
How It Works
Endpoint Structure: Each route is defined with a specific HTTP method (POST, GET, PATCH, DELETE) and path, including parameters for specific user operations.
Middleware:
ensureCorrectUserOrAdmin and ensureAdmin are used to restrict certain operations to either the specific user or an admin.
async function is used to handle asynchronous operations, with errors forwarded to the next middleware using next(err).
Validation:
jsonschema.validate is used to validate request bodies against predefined schemas, ensuring data integrity.
Validation errors are collected and thrown as BadRequestError.
Data Handling: The User model's methods (register, findAll, get, update, remove, applyToJob) are used to interact with the database.
Notes
Error Handling: The try-catch blocks in each route handle errors that may occur during database operations or data validation.
Route Parameters: req.params.username and req.params.id are used to specify the user and job in various routes.
Security and Authorization: Admin-only routes and user-specific routes ensure that user data is protected and actions like creating, updating, and deleting users are appropriately restricted.
This file effectively sets up a RESTful API for user-related operations, leveraging Express.js routing, middleware for authentication and validation, and model methods for database interactions. */

"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is { id, title, companyHandle, companyName, state }
 *
 * Authorization required: admin or same user-as-:username
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/jobs/[id]  { state } => { application }
 *
 * Returns {"applied": jobId}
 *
 * Authorization required: admin or same-user-as-:username
 * */

router.post("/:username/jobs/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const jobId = +req.params.id;
    await User.applyToJob(req.params.username, jobId);
    return res.json({ applied: jobId });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
