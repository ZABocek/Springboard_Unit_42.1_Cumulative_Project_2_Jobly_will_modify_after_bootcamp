/**The provided JavaScript file, jobs.js, defines routes for handling HTTP requests related to job postings in an Express.js application. Here's a detailed documentation of this file:

Overview
This file is part of an Express.js web application that manages job data.
It uses the Job model for database operations and jsonschema for validating request bodies.
Middleware ensureAdmin is used for routes that require admin authorization.
Routes
POST /

Function: Creates a new job posting.
Request Body: Should include title, salary, equity, companyHandle.
Response: Returns created job data including id, title, salary, equity, companyHandle.
Authorization: Admin rights required.
Validation: Uses jobNewSchema for validating the request body.
GET /

Function: Retrieves a list of jobs, with optional filtering.
Query Parameters: Optional filters minSalary, hasEquity (boolean, true if only jobs with equity > 0 are required), title for partial, case-insensitive matches.
Response: Returns an array of job data including company details.
Authorization: None required.
Validation: Uses jobSearchSchema for validating query parameters.
GET /[jobId]

Function: Retrieves detailed data for a specific job.
URL Parameters: jobId of the job.
Response: Returns detailed job data including associated company's details.
Authorization: None required.
PATCH /[jobId]

Function: Updates data for an existing job posting.
URL Parameters: jobId of the job to update.
Request Body: Can include title, salary, equity.
Response: Returns updated job data.
Authorization: Admin rights required.
Validation: Uses jobUpdateSchema for validating the request body.
DELETE /[jobId]

Function: Deletes a specific job posting.
URL Parameters: jobId of the job to delete.
Response: Confirmation of deletion.
Authorization: Admin rights required.
How It Works
Endpoint Structure: Each route is defined with a specific HTTP method (POST, GET, PATCH, DELETE) and path, including parameters for specific job operations.
Middleware:
ensureAdmin is used to restrict certain operations to admin users only.
async function is used to handle asynchronous operations, with errors forwarded to the next middleware using next(err).
Validation:
jsonschema.validate is used to validate request bodies and query parameters against predefined schemas, ensuring data integrity.
Validation errors are collected and thrown as BadRequestError.
Data Handling: The Job model's methods (create, findAll, get, update, remove) are used to interact with the database.
Notes
Error Handling: The try-catch blocks in each route handle errors that may occur during database operations or data validation.
Route Parameters: req.params.id is used to specify the job ID in routes.
Query Processing: In the GET / route, query parameters are converted to appropriate types (e.g., strings to integers, string "true" to boolean).
Security and Authorization: Admin-only routes ensure that sensitive operations (like creating, updating, and deleting job postings) are protected.
This file effectively sets up a RESTful API for job-related operations, leveraging Express.js routing, middleware for authorization and validation, and model methods for database interactions. */

"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router({ mergeParams: true });


/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET / =>
 *   { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ...] }
 *
 * Can provide search filter in query:
 * - minSalary
 * - hasEquity (true returns only jobs with equity > 0, other values ignored)
 * - title (will find case-insensitive, partial matches)

 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as int/bool
  if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
  q.hasEquity = q.hasEquity === "true";

  try {
    const validator = jsonschema.validate(q, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobs = await Job.findAll(q);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[jobId] => { job }
 *
 * Returns { id, title, salary, equity, company }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[jobId]  { fld1, fld2, ... } => { job }
 *
 * Data can include: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: id }
 *
 * Authorization required: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
