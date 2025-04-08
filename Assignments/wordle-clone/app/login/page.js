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
  const [inputIdentifier, setInputIdentifier] = useState(""); // username OR email
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // For sign-up
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async () => {
    setError("");
    setSuccessMsg("");

    try {
      if (isLoginMode) {
        let email = inputIdentifier;

        // If user is logging in with username, look up email
        if (!inputIdentifier.includes("@")) {
          const userDoc = await getDoc(doc(db, "usernames", inputIdentifier));
          if (!userDoc.exists()) {
            setError("❌ Username not found.");
            return;
          }
          email = userDoc.data().email;
        }

        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        // ✅ Check if username is already taken
        const usernameRef = doc(db, "usernames", username);
        const existingUser = await getDoc(usernameRef);
        if (existingUser.exists()) {
          setError("❌ Username already taken. Please choose another.");
          return;
        }

        // ✅ Create account with email + password
        const userCred = await createUserWithEmailAndPassword(auth, inputIdentifier, password);

        // ✅ Set display name to username
        await updateProfile(userCred.user, {
          displayName: username,
        });

        // ✅ Save username → email mapping
        await setDoc(usernameRef, {
          email: inputIdentifier,
          uid: userCred.user.uid,
        });

        setIsLoginMode(true);
        setInputIdentifier("");
        setPassword("");
        setUsername("");
        setSuccessMsg("✅ Account created! Please log in.");
      }
    } catch (err) {
      setError(err.message);
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

      <input
        className="input-box"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error-message">{error}</p>}
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
