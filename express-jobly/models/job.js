/**The provided JavaScript file, job.js, defines a Job class with methods for managing job postings in a database. Here's a detailed documentation of this class:

Class: Job
Description
The Job class includes methods for creating, retrieving (with optional filtering), updating, and deleting job postings in a database.
Methods
static async create(data)

Purpose: Creates a new job posting in the database.
Parameters: data object containing title, salary, equity, companyHandle.
Returns: Job object containing id, title, salary, equity, companyHandle.
Usage: Used to add a new job posting to the database.
static async findAll({ minSalary, hasEquity, title } = {})

Purpose: Finds all jobs, with optional filtering based on salary, equity, and title.
Parameters: An object with optional minSalary, hasEquity, and title fields.
Returns: An array of job objects, each containing id, title, salary, equity, companyHandle, companyName.
Usage: Used to retrieve a list of jobs, optionally filtered by the provided criteria.
static async get(id)

Purpose: Retrieves detailed data about a specific job.
Parameters: id of the job.
Returns: Job object containing id, title, salary, equity, and detailed company information.
Throws: NotFoundError if the job is not found.
Usage: Used to fetch detailed information about a particular job, including the associated company's details.
static async update(id, data)

Purpose: Updates data for an existing job posting.
Parameters: id of the job to update, data object containing updatable fields title, salary, equity.
Returns: Updated job object.
Throws: NotFoundError if the job is not found.
Usage: Used for making updates to existing job postings, supporting partial updates.
static async remove(id)

Purpose: Deletes a job posting from the database.
Parameters: id of the job to delete.
Returns: undefined.
Throws: NotFoundError if the job is not found.
Usage: Used to remove a job posting from the database.
How It Works
Database Interaction: The class interacts with a database (presumably SQL-based) using the db module for executing queries.
SQL Generation: Utilizes sqlForPartialUpdate for generating SQL queries for partial updates, allowing flexibility in updating only specified fields.
Error Handling: Employs NotFoundError for situations where a job doesn't exist in the database.
Security and Integrity: Ensures that data integrity is maintained and that actions such as creation, updating, and deletion are performed only after appropriate checks (e.g., checking for the existence of a job before updating or deleting it).
Notes
The class uses async/await syntax for asynchronous database operations.
The findAll method has a flexible querying mechanism, allowing filtering based on salary, equity, and title.
Job details include a linkage to the company (via companyHandle), integrating job data with company data.
The update method allows partial updates, meaning not all fields need to be provided for an update.
This documentation provides a comprehensive overview of the Job class, detailing the purpose, parameters, return values, exceptions, and general workflow of each method. */

"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle,
        ]);
    let job = result.rows[0];

    return job;
  }

  /** Find all jobs (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - minSalary
   * - hasEquity (true returns only jobs with equity > 0, other values ignored)
   * - title (will find case-insensitive, partial matches)
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */

  static async findAll({ minSalary, hasEquity, title } = {}) {
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs j 
                   LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let whereExpressions = [];
    let queryValues = [];

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY title";
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
