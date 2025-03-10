const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

//test

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
