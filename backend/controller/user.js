const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");
require('dotenv').config();
async function handleSignup(req, res) {
  console.log(req.body);
  const { email, username, password } = req.body;

  const salt = bcrypt.genSaltSync(10);
  const passHash = bcrypt.hashSync(password, salt);

  const user = await User.create({
    username,
    email,
    password: passHash,
  });

  if (user) {
    return res.status(201).json({ message: "User created ", user });
  }
}
async function handleLogin(req, res) {
  const { username, password, rememberMe } = req.body;
  // console.log(req.body)
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }

  const authUser = bcrypt.compareSync(password, user.password);
  if (!authUser) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }
  const token = setUser(user);

  if (process.env.mode == "development") {
    return res.status(200).json({ message: "Logged in!", token , rememberMe});
  } else {
    res.cookie("uid", token, {
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
      maxAge: rememberMe? 7 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ message: "Logged in!" });
  }
  
}
module.exports = {
  handleLogin,
  handleSignup,
};
