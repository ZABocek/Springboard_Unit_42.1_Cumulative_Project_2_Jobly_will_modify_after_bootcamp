/**The provided JavaScript file, user.js, defines a User class with methods for managing user data in a database. Here's a detailed documentation of this class:

Class: User
Description
The User class includes methods for user authentication, registration, retrieval, updating, and deletion in a database.
Methods
static async authenticate(username, password)

Purpose: Authenticates a user with a username and password.
Parameters: username (string), password (string).
Returns: User object containing username, firstName, lastName, email, and isAdmin.
Throws: UnauthorizedError if the username is not found or the password is incorrect.
static async register({ username, password, firstName, lastName, email, isAdmin })

Purpose: Registers a new user with the provided data.
Parameters: An object containing username, password, firstName, lastName, email, isAdmin.
Returns: Registered user object excluding password.
Throws: BadRequestError if the username already exists (duplicate username).
static async findAll()

Purpose: Retrieves all users from the database.
Returns: An array of user objects, each containing username, firstName, lastName, email, and isAdmin.
static async get(username)

Purpose: Retrieves data for a specific user.
Parameters: username (string).
Returns: User object containing username, firstName, lastName, email, and isAdmin.
Throws: NotFoundError if the user is not found.
static async update(username, data)

Purpose: Updates data for an existing user. Can update a subset of user fields.
Parameters: username (string), data (object) containing possible fields firstName, lastName, password, email, isAdmin.
Returns: Updated user object.
Throws: NotFoundError if the user is not found.
Security Note: This method can change a user's password or admin status, so it must be used with caution.
static async remove(username)

Purpose: Deletes a user from the database.
Parameters: username (string).
Returns: undefined.
Throws: NotFoundError if the user is not found.
Dependencies
External modules such as db for database connectivity, bcrypt for password hashing, and sqlForPartialUpdate for generating SQL for partial updates.
Custom error types (NotFoundError, BadRequestError, UnauthorizedError) are used for error handling.
BCRYPT_WORK_FACTOR from configuration for bcrypt hashing.
Error Handling
Custom errors are thrown in specific situations like unauthorized access, duplicate user registration, or user not found scenarios.
Notes
The class utilizes async/await syntax for handling asynchronous database operations.
Passwords are hashed using bcrypt before being stored in the database, enhancing security.
The update method supports partial updates, meaning only specified fields will be updated.
Care should be taken especially with the update method due to its ability to change sensitive user data, including passwords and admin status.
This documentation provides a comprehensive overview of the User class, detailing the purpose, parameters, return values, exceptions, dependencies, error handling, and security considerations of each method. */

"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}


module.exports = User;
