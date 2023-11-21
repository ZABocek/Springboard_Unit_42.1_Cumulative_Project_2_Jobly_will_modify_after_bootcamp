const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Designed to take in an object representing the data to be updated and another object that maps JavaScript-style field names to their corresponding SQL database column names. It's used in situations where only a subset of a record's fields need to be updated.
 * @param {*} dataToUpdate An object containing the fields that need to be updated. The keys are the field names, and the values are the new values for those fields.
 * @param {*} jsToSql An object that maps JavaScript-style naming conventions (e.g., firstName) to SQL column naming conventions (e.g., first_name).
 * @returns The function returns an object with two properties:
setCols: A string representing the SET clause of the SQL update statement. This string includes the column names and parameter placeholders.
values: An array of the values that correspond to the placeholders in the SET clause.
* @example If you call sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {firstName: 'first_name'}), the function returns:
{ setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }
This output can then be used to construct an SQL UPDATE statement in a way that is flexible and secure against SQL injection.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
