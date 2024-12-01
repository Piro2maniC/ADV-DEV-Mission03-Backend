const cors = require("cors");
const express = require("express");
require("dotenv").config();
const userRouter = require("./routes/userRouter");
// Enable express
const app = express();
//Middleware run middleware function before the request gets into route handler
app.use(cors());

// Use the router for a specific path
app.use("/api", userRouter);

// default route handler
app.get("/", (req, res) => {
  res.send("hello world");
});

// Set up port
const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
