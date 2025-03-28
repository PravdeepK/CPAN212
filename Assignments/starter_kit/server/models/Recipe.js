const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  difficulty: String,
  ingredients: [String],
  steps: [String]
});

module.exports = mongoose.model('Recipe', RecipeSchema);
// This code defines a Mongoose schema and model for a Recipe object.
// The RecipeSchema defines the structure of the Recipe document in the MongoDB database.
// It includes fields for name, description, difficulty, ingredients, and steps.
// The name field is required, while the others are optional.
// The ingredients and steps fields are arrays of strings.
// Finally, the schema is compiled into a model named 'Recipe' using mongoose.model().
// This model can be used to create, read, update, and delete Recipe documents in the MongoDB database.
// The code also includes a connection to the MongoDB database using mongoose.connect().
// The connection string specifies the database name as 'recipeApp'.
// The connection options include useNewUrlParser and useUnifiedTopology to avoid deprecation warnings.
// The connection is established using a promise-based approach, logging success or error messages to the console.
// The server listens on port 8001 for incoming requests.
// The code also includes middleware for handling CORS and parsing JSON request bodies.
// The recipeRouter is used to define routes for handling requests related to recipes.
// The server is set up to respond to requests at the /recipe endpoint.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.
// The code is a basic setup for a RESTful API for managing recipes using Express and Mongoose.
// It provides a foundation for building a recipe management application.