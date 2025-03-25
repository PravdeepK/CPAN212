import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";


const Homepage = () => {
  const [books, setBooks] = useState([]);

  // Fetch featured books on component mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Retrieve the token from localStorage (or sessionStorage, cookies, etc.)
        const token = localStorage.getItem("authToken");

        // If token exists, include it in the Authorization header
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}api/books`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add the token to the request headers
          },
        });

        const data = await response.json();
        console.log(data);

        if (response.ok) {
          setBooks(data.slice(0, 5)); // Show the first 5 books
        } else {
          console.error("Error fetching books:", data);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Featured Books</h2>

      <div style={styles.bookList}>
        {books.length > 0 ? (
          books.map((book) => (
            <div key={book._id} style={styles.bookCard}>
              <h3 style={styles.bookTitle}>{book.title}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Price:</strong> ${book.price.toFixed(2)}</p>
              <Link to={`/books/${book._id}`}>View Details</Link>
            </div>
          ))
        ) : (
          <p>No books available at the moment.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    color: "#6b4a30",
    fontSize: "2rem",
    borderBottom: "2px solid #6b4a30",
    display: "inline-block",
    marginBottom: "20px",
  },
  bookList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  bookCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    textAlign: "center",
  },
  bookTitle: {
    fontSize: "1.5rem",
    color: "#6b4a30",
    margin: "10px 0",
  },
  detailsLink: {
    display: "inline-block",
    marginTop: "10px",
    padding: "10px 15px",
    backgroundColor: "#c49d68",
    color: "#f4f1ea",
    textDecoration: "none",
    borderRadius: "5px",
  },
};

export default Homepage;
