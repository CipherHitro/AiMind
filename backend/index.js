const express = require("express");
const http = require("http");
const { connectMongoDB } = require("./connection");
const userRoute = require('./routes/user')
const organizationRoute = require('./routes/organization')
const chatRoute = require('./routes/chat')
const notificationRoute = require('./routes/notification')
const cors = require("cors");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { initializeSocket } = require('./services/socket');
const { authenticateUser } = require('./middlewares/auth');

require("dotenv").config();

const corsOptions = {
  origin: process.env.CLIENT_API, 
  credentials: true,              
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']

};
const app = express();
const server = http.createServer(app);
const port = 3000;

//Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Morgan Logger - different formats for development and production
if (process.env.NODE_ENV === 'production') {
  // Combined format for production (includes more details)
  app.use(morgan('combined'));
} else {
  // Dev format for development (colored and concise)
  app.use(morgan('dev'));
}


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


app.use('/api/user', userRoute);
app.use('/api/organization', authenticateUser, organizationRoute);
app.use('/api/chat', chatRoute);
app.use('/api/notification', authenticateUser,  notificationRoute);

server.listen(port, () => {
  console.log("Server is running at http://localhost:" + port);
});
