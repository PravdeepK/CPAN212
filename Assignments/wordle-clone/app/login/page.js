"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const db = getFirestore();

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [inputIdentifier, setInputIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async () => {
    setError("");
    setSuccessMsg("");

    try {
      if (isLoginMode) {
        let email = inputIdentifier;

        if (!inputIdentifier.includes("@")) {
          const usernameKey = inputIdentifier.toLowerCase();
          const userDoc = await getDoc(doc(db, "users", usernameKey));
          if (!userDoc.exists()) {
            setError("Username not found.");
            return;
          }
          email = userDoc.data().email;
        }

        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        const usernameKey = username.toLowerCase();

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const userDocRef = doc(db, "users", usernameKey);
        const existingUser = await getDoc(userDocRef);
        if (existingUser.exists()) {
          setError("Username already taken. Please choose another.");
          return;
        }

        const userCred = await createUserWithEmailAndPassword(auth, inputIdentifier, password);

        await updateProfile(userCred.user, {
          displayName: username,
        });

        await setDoc(userDocRef, {
          email: inputIdentifier,
          uid: userCred.user.uid,
        });

        setIsLoginMode(true);
        setInputIdentifier("");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
        setSuccessMsg("Account created! Please log in.");
      }
    } catch (err) {
      const fallback = err.message || "Something went wrong";
      const formatted = err.code === "auth/email-already-in-use"
        ? "Error: Email already in use"
        : "Error: " + fallback;
      setError(formatted);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full text-center gap-5">
      <h1 className="title">{isLoginMode ? "Login" : "Sign Up"}</h1>

      {!isLoginMode && (
        <input
          className="input-box"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      )}

      <input
        className="input-box"
        type={isLoginMode ? "text" : "email"}
        placeholder={isLoginMode ? "Username or Email" : "Email"}
        value={inputIdentifier}
        onChange={(e) => setInputIdentifier(e.target.value)}
      />

      {/* Password Field */}
      <div className="flex flex-col items-center">
        <input
          className="input-box"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="mt-1 text-sm text-gray-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show password
        </label>
      </div>

      {/* Confirm Password for Sign Up */}
      {!isLoginMode && (
        <div className="flex flex-col items-center">
          <input
            className="input-box"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label className="mt-1 text-sm text-gray-700 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showConfirmPassword}
              onChange={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            Show confirm password
          </label>
        </div>
      )}

      {error && <div className="pretty-error">{error}</div>}
      {successMsg && <p className="win-message">{successMsg}</p>}

      <button onClick={handleAuth} className="restart-button">
        {isLoginMode ? "Login" : "Create Account"}
      </button>

      <button
        onClick={() => {
          setIsLoginMode(!isLoginMode);
          setError("");
          setSuccessMsg("");
        }}
        className="scoreboard-button"
      >
        {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Login"}
      </button>
    </div>
  );
}
