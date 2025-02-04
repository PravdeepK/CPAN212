/* Project setup: For the server
1 - new project folder
2 - open an integrated terminal
3 - run these commands:
    npm init -y
    npm i express nodemon
    (optional) -> go into package.json and add "type": "module" to enable import from 
*/
 
// [Please enable only ONE of these] 
import express from "express"; // if you are using type: module
// const express = require("express"); // if using common JS (Default)
 
const app = express();
const PORT = process.env.PORT || 8000;
 
// middlelware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
// routes
app.get("/", (req, res) => {
  console.log(req.url);
  console.log(req.method);
  console.log(req.url);
  console.log(req.url);
  res.send("Welcome to our server");
});

app.get("/about", (req, res) => {
  res.send("Welcome to the about page");
});

app.get("/login", (req, res) => {
  res.send("We have received your login request");
});

app.get("/login", (req, res) => {
  res.send("We stole your information");
});

app.get("/fetchData", (req, res) => {
  res.send("Welcome to our server");
});
 
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
 
app.use("", (req, res) => {
  res.status(404).send("Page not found");
});