
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
//const express = require("express"); // if using common JS (Default)
 
const app = express();
const PORT = process.env.PORT || 8000;
 
// middlelware

 
// routes
app.get("/", (req, res) => {
  res.send("Welcome to our server");
});

//send data
app.get("/data", (req, res) => {
    const data = {
        lname: "Kullar",
        fname: "Pravdeep",
    };
    res.send(data);
  });
 
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
 
app.use("", (req, res) => {
  res.status(404).send("Page not found");
});