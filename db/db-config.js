//db-config.js
const mysql = require("mysql2");
const fs = require("fs");

// Database config
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./DigiCertGlobalRootCA.crt.pem"),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Database connection established successfully.");
    connection.release();
  }
});

module.exports = pool;
