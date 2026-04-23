require("dotenv").config({path: ".env"});
const express = require("express");
const path = require("node:path");
const cors = require("cors");
const indexRouter = require("./routes/indexRouter.js");

const CustomNotFoundError = require('./errors/CustomNotFoundError.js');

const prisma = require("./lib/prisma.js")

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.use("/", indexRouter);

app.use((err, req, res, next) => {
  if (!(err instanceof CustomNotFoundError)) {
    console.error(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).send(`${err.name}: ${err.message}`);
});

app.listen(3000, (error) => {
    if(error) {
        throw error;
    }
    console.log("Listening on PORT 3000");
})