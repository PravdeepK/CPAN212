import express from "express";
import User from "../models/user.js";
import bcrypt, { compare } from "bcryptjs";

const router = express.Router();

//register
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  //hash password
  bcrypt.hash(password, 10).then((hashedPassword) => {
    let newUser = new User({
      email,
      password: hashedPassword,
    });

    newUser.save().then(() => {
      res.json({ message: "User registered" });
    });
  });
});

//login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.find({ email: email })
    .then((userAccount) => {
        if(!userAccount){
        res.status(400).json({ message: "User not found" });
        }
      bcrypt.compare(password, userAccount.password).then((compareResult) => {
        if (compareResult) {
          res.json({ message: "User logged in" });
        }
      });
    })
    .catch((err) => {
      console.log("User not found");
      res.json({ message: "User not found" });
    });
});
export default router;
/* 
    1 - register
        1. parse info
        2. hash password
        3. save user
    2 - login
*/
