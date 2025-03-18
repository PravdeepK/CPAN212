//imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

//variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 6000;

//middlewares

//routes

//startup
mongoose.connect(process.env.MONGODB_URL)
.then(() => {
    console.log('Connected to DB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

