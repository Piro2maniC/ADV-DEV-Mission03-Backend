//userController.js
const userModel = require("../models/userModel");

const getAllUsers = async (req, res) => {
  try {
    // Execute the query to get all users
    const [rows, fields] = await userModel.queryAllUsers();
    // Send the rows (user data) back to the client
    res.send(rows);
  } catch (err) {
    console.log(err);
  }
};

module.exports = { getAllUsers };
// rows: Contains the data returned from the query, representing the actual records retrieved from the database.
// fields: Contains metadata about the columns in the result set, which may not be needed in most typical use cases.
