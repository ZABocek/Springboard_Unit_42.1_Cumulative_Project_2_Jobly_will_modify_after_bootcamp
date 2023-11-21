"use strict";

/** Express app for jobly. */
/**
 * This app.js file is the main application file for a Node.js web application using the Express framework, designed for a job-related platform (presumably named "jobly"). The file sets up the server, including its routes, middleware, error handling, and logging. Below is an explanation of its components, which can assist in adding documentation:

Module Imports and Setup:

Imports necessary modules like express, cors, and morgan, and specific functions or routes from other files in the project.
The express module is used to create an Express application. cors is used for Cross-Origin Resource Sharing, and morgan is a middleware for logging HTTP requests.
Express Application Initialization:

const app = express(); initializes a new Express application.
Middleware Usage:

app.use(cors()); enables CORS for all routes.
app.use(express.json()); allows the app to parse JSON in request bodies.
app.use(morgan("tiny")); adds logging of requests in 'tiny' format.
app.use(authenticateJWT); applies a custom JWT authentication middleware to all routes. This middleware presumably checks for a valid JWT in the request and sets the user's information in the request context.
Route Handlers:

Routes for different parts of the application (auth, companies, users, jobs) are set up. Each route is prefixed with its respective path (e.g., /auth, /companies).
These routes are linked to their respective modules, which contain the logic for handling specific requests related to authentication, companies, users, and jobs.
Error Handling:

The app.use function for handling 404 errors sends a NotFoundError for any request to a route that is not defined.
A generic error handler is set up to catch and handle all unhandled errors in the application. It logs the error stack (except in test environment), and sends a JSON response containing the error message and status code.
Exporting the App:

Finally, the configured Express application (app) is exported. This allows it to be imported and used in other files, such as a server initialization file that would actually start the web server.
In summary, app.js configures the Express application by setting up middleware, defining routes, and handling errors, creating a structured backend for a job platform. Documentation should describe the purpose and functionality of each section and detail how the Express app is structured and configured for handling different aspects of the jobly platform.
 */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const companiesRoutes = require("./routes/companies");
const usersRoutes = require("./routes/users");
const jobsRoutes = require("./routes/jobs");

const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/users", usersRoutes);
app.use("/jobs", jobsRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
