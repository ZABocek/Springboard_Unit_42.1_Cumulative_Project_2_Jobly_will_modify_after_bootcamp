/**The provided JavaScript file, companies.js, defines routes for handling HTTP requests related to company data in an Express.js application. Here's a detailed documentation of this file:

Overview
This file is a part of an Express.js web application dealing with company data.
It uses the Company model for database operations and jsonschema for validating request bodies.
Middleware ensureAdmin is used for routes that require admin authorization.
Routes
POST /

Function: Creates a new company.
Request Body: Should include handle, name, description, numEmployees, logoUrl.
Response: Returns created company data.
Authorization: Admin rights required.
Validation: Uses companyNewSchema for validating the request body.
GET /

Function: Retrieves a list of companies, with optional filtering.
Query Parameters: Optional filters minEmployees, maxEmployees, nameLike for partial, case-insensitive matches.
Response: Returns an array of company data.
Authorization: None required.
Validation: Uses companySearchSchema for validating query parameters.
GET /:handle

Function: Retrieves detailed data for a specific company.
URL Parameters: handle of the company.
Response: Returns detailed company data including associated jobs.
Authorization: None required.
PATCH /:handle

Function: Updates data for an existing company.
URL Parameters: handle of the company to update.
Request Body: Can include name, description, numEmployees, logo_url.
Response: Returns updated company data.
Authorization: Admin rights required.
Validation: Uses companyUpdateSchema for validating the request body.
DELETE /:handle

Function: Deletes a specific company.
URL Parameters: handle of the company to delete.
Response: Confirmation of deletion.
Authorization: Admin rights required.
How It Works
Endpoint Structure: Each route is defined with a specific HTTP method (POST, GET, PATCH, DELETE) and path. The paths include parameters (like :handle) for specific company operations.
Middleware:
ensureAdmin is used to restrict certain operations to admin users only.
async function is used to handle asynchronous operations and errors are forwarded to the next middleware with next(err).
Validation:
jsonschema.validate is used to validate request bodies against predefined schemas, ensuring data integrity.
Errors from validation are collected and thrown as BadRequestError.
Data Handling: The Company model's methods (create, findAll, get, update, remove) are used to interact with the database.
Notes
Error Handling: The try-catch blocks handle errors that may occur during database operations or data validation.
Route Parameters: req.params.handle is used to specify the company handle in routes.
Query Processing: In the GET / route, query parameters are converted to appropriate types (e.g., strings to integers).
Security and Authorization: Admin-only routes ensure that sensitive operations (like creating, updating, and deleting companies) are protected.
This file effectively sets up a RESTful API for company-related operations, leveraging Express.js routing, middleware for authorization and validation, and model methods for database interactions. */

"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as ints
  if (q.minEmployees !== undefined) q.minEmployees = +q.minEmployees;
  if (q.maxEmployees !== undefined) q.maxEmployees = +q.maxEmployees;

  try {
    const validator = jsonschema.validate(q, companySearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const companies = await Company.findAll(q);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
