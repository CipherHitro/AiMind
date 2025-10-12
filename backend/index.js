const express = require("express");
const { connectMongoDB } = require("./connection");
const userRoute = require('./routes/user')
const cors = require("cors");
const cookieParser = require('cookie-parser');
require("dotenv").config();

const corsOptions = {
  origin: 'http://localhost:5173', //  Must be a specific origin, not '*'
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
const app = express();
const port = 3000;

//Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectMongoDB(process.env.MONGO_URI)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.error(err));


app.use('/user', userRoute);

app.listen(port, () => {
  console.log("Server is running at http://localhost:" + port);
});
