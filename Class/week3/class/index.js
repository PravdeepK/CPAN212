import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

//CRUD -> server is setup to do these things

// Methods: GET(READ), POST(CREATE), PUT(UPDATE), DELETE

// READ (pretty much an if statement)
app.get("/", (req, res)=>{
    res.send("Welcome to the server - GET")
})
app.post("/", (req, res)=>
    res.send("Welcome to the server - POST")) 
app.put("/", (req, res)=>{
    res.send("Welcome to the server - PUT")
}) 
app.delete("/", (req, res)=>{
    res.send("Welcome to the server - DELETE")
})

app.get("/search", (req, res)=>{
    console.log(req.url)
    console.log(req.headers)
    console.log(req.query)
    console.log(req.params)
    console.log(req.body)
    res.send("you came to the /search route")
})

app.get("/item/:itemID", (req, res)=>{
    console.log(req.url)
    console.log(req.headers)
    console.log(req.params)
    res.send("you came to the /item route")
})


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

