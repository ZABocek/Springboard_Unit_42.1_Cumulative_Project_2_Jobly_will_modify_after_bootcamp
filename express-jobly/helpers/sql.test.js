/**
 * Test Setup:

The test file imports the sqlForPartialUpdate function from the sql.js file. This is the function that will be tested.
It uses describe to define a test suite for the sqlForPartialUpdate function. Inside this block, individual test cases are defined using the test function.
Test Cases:

There are two test cases in this file, each testing a different scenario of the sqlForPartialUpdate function.
First Test - "works: 1 item":

Purpose: This test checks if the function correctly handles an update with a single field.
Test Execution:
The sqlForPartialUpdate function is called with { f1: "v1" } as the dataToUpdate and { f1: "f1", fF2: "f2" } as the jsToSql mapping.
It expects the function to return an object with the setCols property set to "f1"=$1 and the values property as an array containing ["v1"].
Expectation: The test asserts that the function's output matches the expected result, verifying that the function correctly formats the SQL update statement for one field.
Second Test - "works: 2 items":

Purpose: This test checks if the function correctly handles an update with two fields.
Test Execution:
The function is called with { f1: "v1", jsF2: "v2" } as the dataToUpdate and { jsF2: "f2" } as the jsToSql mapping.
It expects the function to return an object with the setCols property set to "f1"=$1, "f2"=$2 and the values property as an array containing ["v1", "v2"].
Expectation: The test asserts that the function's output matches the expected result, verifying that the function correctly formats the SQL update statement for two fields.
These tests are essential to ensure that the sqlForPartialUpdate function behaves as expected in different scenarios. By specifying the input and asserting the expected output, the tests validate the correctness and reliability of the function. This practice of writing tests for code is a crucial part of software development, known as "test-driven development" (TDD), which helps in building robust and error-free applications.
 */
const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("works: 1 item", function () {
    const result = sqlForPartialUpdate(
        { f1: "v1" },
        { f1: "f1", fF2: "f2" });
    expect(result).toEqual({
      setCols: "\"f1\"=$1",
      values: ["v1"],
    });
  });

  test("works: 2 items", function () {
    const result = sqlForPartialUpdate(
        { f1: "v1", jsF2: "v2" },
        { jsF2: "f2" });
    expect(result).toEqual({
      setCols: "\"f1\"=$1, \"f2\"=$2",
      values: ["v1", "v2"],
    });
  });
});
