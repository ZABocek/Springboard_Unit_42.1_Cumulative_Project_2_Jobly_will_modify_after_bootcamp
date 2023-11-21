/**The JavaScript file auth.js is designed to handle authentication-related routes in an Express.js application. Here's a detailed documentation of this file:

Overview
This file is part of a web application and is responsible for user authentication.
It uses the User model for handling user data and jsonschema for validating request bodies.
The routes provide functionality for user login and registration.
JSON Web Tokens (JWT) are used for authentication, with tokens being generated and returned upon successful login or registration.
Routes
POST /auth/token

Function: Authenticates a user and returns a JWT token.
Request Body: Should include username and password.
Response: JWT token for authenticated user.
Authorization: No prior authorization is required to access this route.
Validation: Uses userAuthSchema to validate the request body.
Error Handling: Throws BadRequestError if validation fails.
POST /auth/register

Function: Registers a new user and returns a JWT token.
Request Body: Must include username, password, firstName, lastName, and email.
Response: JWT token for the newly registered user.
Authorization: No prior authorization is required to access this route.
Validation: Uses userRegisterSchema to validate the request body.
Error Handling: Throws BadRequestError if validation fails.
Additional Note: Automatically sets isAdmin to false for new users.
How It Works
User Authentication and Registration:
The /auth/token route uses the User.authenticate method to verify user credentials.
The /auth/register route uses the User.register method to create a new user account.
Token Creation:
Upon successful authentication or registration, a JWT token is generated using the createToken function from ../helpers/tokens.
This token is then returned in the response, which the client can use for authenticating further requests.
Validation:
Request bodies are validated against JSON schemas (userAuthSchema and userRegisterSchema) to ensure they contain the required fields and adhere to the expected format.
Error Handling:
If validation fails, the route responds with a BadRequestError, detailing the validation issues.
Usage in Application
Authentication Flow:
Users submit their credentials (username and password) to /auth/token to receive a token.
New users can register via /auth/register by providing their details, after which they receive a token.
Securing Routes:
The generated JWT token can be used to secure other routes in the application. By requiring a valid token for access, you can ensure that only authenticated users can access certain endpoints.
User Management:
These routes facilitate basic user management functions like user login and registration within the application.
This setup is a standard approach in modern web applications for handling user authentication, providing a secure and efficient way to manage user sessions and access control. */

"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newUser = await User.register({ ...req.body, isAdmin: false });
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
