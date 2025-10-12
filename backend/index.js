const express = require("express");
const http = require("http");
const { connectMongoDB } = require("./connection");
const userRoute = require('./routes/user')
const organizationRoute = require('./routes/organization')
const chatRoute = require('./routes/chat')
const notificationRoute = require('./routes/notification')
const cors = require("cors");
const cookieParser = require('cookie-parser');
const { initializeSocket } = require('./services/socket');
const { authenticateUser } = require('./middlewares/auth');

require("dotenv").config();

const corsOptions = {
  origin: process.env.CLIENT_API, 
  credentials: true,              
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
const app = express();
const server = http.createServer(app);
const port = 3000;

//Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectMongoDB(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected");
    
    // Initialize Socket.IO after database connection
    initializeSocket(server);
  })
  .catch((err) => console.error(err));


app.use('/user', userRoute);
app.use('/organization', organizationRoute);
app.use('/chat', chatRoute);
app.use('/notification', authenticateUser,  notificationRoute);

server.listen(port, () => {
  console.log("Server is running at http://localhost:" + port);
});
