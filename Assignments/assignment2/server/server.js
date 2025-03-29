const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const recipeRouter = require('./routes/recipes_router');

const app = express();
const PORT = 8001;

//midware
app.use(cors());
app.use(express.json());

//mongodb connection
mongoose.connect('mongodb://localhost:27017/recipeApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/recipe', recipeRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
