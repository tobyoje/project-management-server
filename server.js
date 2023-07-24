require("dotenv").config();
const cors = require("cors");
const express = require("express");

const PORT = process.env.PORT;
const app = express();
app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} `);
});
