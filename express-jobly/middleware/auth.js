/**The JavaScript file auth.js in the /middleware directory provides middleware functions for handling authentication and authorization in an Express.js application. Below is a detailed documentation of this file:

Overview
This file defines middleware functions that integrate with JWT (JSON Web Token) for authentication and authorization purposes.
The middleware functions are designed to be used in Express route handlers to control access based on various criteria like login status, admin status, or specific user identity.
Middleware Functions
authenticateJWT(req, res, next)

Purpose: To authenticate a user based on a JWT token.
Operation:
Extracts the JWT token from the Authorization header of the request.
If a token is present, it verifies the token using the jwt.verify method with the SECRET_KEY.
On successful verification, stores the user information (including username and isAdmin) in res.locals.user.
Error Handling: Does not throw an error if no token is provided or if the token is invalid. The function allows the request to proceed without authentication in such cases.
ensureLoggedIn(req, res, next)

Purpose: To ensure that the request is made by a logged-in user.
Operation:
Checks if res.locals.user is set, indicating an authenticated user.
Error Handling: Throws an UnauthorizedError if no user is authenticated.
ensureAdmin(req, res, next)

Purpose: To ensure that the request is made by an admin user.
Operation:
Checks if res.locals.user is set and whether the isAdmin property is true.
Error Handling: Throws an UnauthorizedError if the user is not an admin or not authenticated.
ensureCorrectUserOrAdmin(req, res, next)

Purpose: To ensure that the request is made by either an admin user or the user specified in the route parameter :username.
Operation:
Verifies that res.locals.user is set and that the user is either an admin or matches the username specified in the request parameters.
Error Handling: Throws an UnauthorizedError if the user does not meet the required criteria.
Usage in Application
These middleware functions are typically used in Express route definitions to secure endpoints.
authenticateJWT is often used globally or on specific routes where user identification is necessary, even if the route is publicly accessible.
ensureLoggedIn, ensureAdmin, and ensureCorrectUserOrAdmin are used to protect routes that require a logged-in user, admin user, or a specific authorized user, respectively.
How It Works
When a request is made to an endpoint, the middleware functions intercept the request.
They perform checks based on JWT tokens and user information to determine if the request should proceed.
If the checks pass, next() is called, allowing the request to continue to the route handler.
If the checks fail, an error is thrown, typically resulting in an unauthorized response to the client.
In summary, auth.js provides essential middleware functions for authenticating and authorizing users in an Express.js application, ensuring that routes and resources are accessed only by appropriately authenticated and authorized users. */

"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when the user must be an admin.
 * If not, raises Unauthorized.
 */
function ensureAdmin(req, res, next) {
  if (!res.locals.user || !res.locals.user.isAdmin) {
    return next(new UnauthorizedError());
  }
  return next();
}

/** Middleware to use when the user must be an admin or the same user as :username.
 * If not, raises Unauthorized.
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  const user = res.locals.user;
  if (!(user && (user.isAdmin || user.username === req.params.username))) {
    return next(new UnauthorizedError());
  }
  return next();
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
};