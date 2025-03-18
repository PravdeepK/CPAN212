import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

/* 
    1 - register
        1. parse info
        2. hash password
        3. save user
    2 - login
*/