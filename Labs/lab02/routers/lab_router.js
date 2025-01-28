/* 
    /name
    /greeting
    /add
    /calculate
*/

import express from "express";

const router = express.Router();

//checking if in route
router.get("/", (req, res) => {
  res.send("welcome to the lab router");
});

//name route
router.get("/name", (req, res) => {
  res.send("Pravdeep Kullar");
});

//greeting
router.get("/greeting", (req, res) => {
  res.send("Hello from Pravdeep, Student number: n01430968");
});

//add
router.get("/add/:x/:y", (req, res) => {
  let x = parseFloat(req.params.x);
  let y = parseFloat(req.params.y);
  res.send(`${x + y}`);
});

//calculate
router.get("/calculate/:a/:b/:operation", (req, res) => {
  let a = parseFloat(req.params.a);
  let b = parseFloat(req.params.b);
  let operation = req.params.operation;
  let result = 0;

  switch (operation) {
    case "+":
      result = a + b;
      break;

    case "-":
      result = a - b;
      break;

    case "*":
      result = a * b;
      break;

    case "/": // -> %2f
      if (b === 0) {
        return res.send("Error: Division by zero is not allowed");
      }
      result = a / b;
      break;

    case "**":
      result = a ** b; // Exponentiation
      break;

    default:
      res.send("Invalid operation");
      break;
  }
  res.send(`Result: ${result}`);
});

export default router;
