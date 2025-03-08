import { useState } from "react";
import "./styles/styles.css"; // Import global styles
import TypingAnimation from "./components/TypingAnimation";

function App() {
  const [showProjects, setShowProjects] = useState(false);

  // Function to open the resume link
  const openResume = () => {
    window.open(
      "https://docs.google.com/document/d/1-scnARFnWeOxU5molGo561xV4tMgvr4i/edit?usp=drive_link&ouid=113750505912466755486&rtpof=true&sd=true",
      "_blank"
    );
  };

  // Function to open GitHub profile
  const openGitHub = () => {
    window.open("https://github.com/PravdeepK", "_blank");
  };

  // Function to open email client with predefined recipient
  const openEmail = () => {
    window.location.href = "mailto:pravdeepkk@gmail.com";
  };

  // Function to toggle project section
  const toggleProjects = () => {
    setShowProjects(!showProjects);
  };

  return (
    <div className="container">
      {/* Navigation Bar */}
      <nav className="nav-bar">
        <button className="nav-button" onClick={openResume}>Resume</button>
        <button className="nav-button" onClick={openEmail}>Contact</button>
        <button className="nav-button" onClick={toggleProjects}>Projects</button>
        <button className="nav-button" onClick={openGitHub}>GitHub</button>
      </nav>

      {/* Typing Animation */}
      <div className="typing-wrapper">
        <TypingAnimation />
      </div>

      {/* Projects Section */}
      <div className={`projects-container ${showProjects ? "show" : ""}`}>
        <div className="project-box">Project 1</div>
        <div className="project-box">Project 2</div>
        <div className="project-box">Project 3</div>
        <div className="project-box">Project 4</div>
      </div>
    </div>
  );
}

export default App;
