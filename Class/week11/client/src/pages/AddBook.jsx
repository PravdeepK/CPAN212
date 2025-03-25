import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';


const AddBook = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publishers: "",
    genres: "",
    price: "",
    pages: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You must be logged in to add a book.");
        return;
      }

      // Make the POST request with the token in the Authorization header
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}api/books/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // Add the token to the Authorization header
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Book added successfully!");
        setFormData({
          title: "",
          author: "",
          publishers: "",
          genres: "",
          price: "",
          pages: "",
        });
        navigate("/");
      } else {
        alert(`Error: ${data.message}`);

      }
    } catch (error) {
      console.error("Error adding book:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="add-book">
      <h2>Add a New Book</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          value={formData.author}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="publishers"
          placeholder="Publishers"
          value={formData.publishers}
          onChange={handleChange}
        />
        <input
          type="text"
          name="genres"
          placeholder="Genres"
          value={formData.genres}
          onChange={handleChange}
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="pages"
          placeholder="Pages"
          value={formData.pages}
          onChange={handleChange}
        />
        <button type="submit">Add Book</button>
      </form>
    </div>
  );
};

export default AddBook;
