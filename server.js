require("dotenv").config();
const cors = require("cors");
const express = require("express");

const PORT = process.env.PORT || 5050;
const app = express();
app.use(cors());
app.use(express.json());

// app.get("/test/api", function (req, res) {
//   res.send("Welcome to this place");
// });

const usersRoutes = require("./routes/user-routes");
app.use("/api/user", usersRoutes);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} `);
});
