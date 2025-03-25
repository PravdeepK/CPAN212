// hooks/useAuth.js
import { jwtDecode } from "jwt-decode";

const useAuth = () => {
  const token = localStorage.getItem("authToken");

  if (!token) return { isAuthenticated: false, userName: "Guest" };

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp && decodedToken.exp > currentTime) {
      return { isAuthenticated: true, userName: decodedToken.first_name || "User" };
    } else {
      localStorage.removeItem("authToken"); // Expired, remove it
      return { isAuthenticated: false, userName: "Guest" };
    }
  } catch (error) {
    console.error("Error decoding token", error);
    localStorage.removeItem("authToken"); // Invalid token, remove it
    return { isAuthenticated: false, userName: "Guest" };
  }
};

export default useAuth;
