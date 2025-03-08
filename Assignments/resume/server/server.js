const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data
const education = [
    { degree: "B.Sc. in Computer Science", institution: "XYZ University", year: "2023" },
    { degree: "High School Diploma", institution: "ABC High School", year: "2019" }
];

const experience = [
    { role: "Software Developer", company: "Tech Corp", year: "2024 - Present" },
    { role: "Intern", company: "Startup Ltd.", year: "2023" }
];

const overview = { name: "John Doe", bio: "A passionate software developer skilled in React and Express." };

// API Endpoints
app.get('/getEdu', (req, res) => res.json(education));
app.get('/getExp', (req, res) => res.json(experience));
app.get('/getOverview', (req, res) => res.json(overview));

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
