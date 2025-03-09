import { useState } from "react";
import "./styles/styles.css"; // Import global styles
import TypingAnimation from "./components/TypingAnimation";
import project1Gif from "./assets/project01.gif"; // Import Project 1 GIF

function App() {
  const [showProjects, setShowProjects] = useState(false);

  // Function to open links
  const openResume = () => window.open("https://docs.google.com/document/d/1-scnARFnWeOxU5molGo561xV4tMgvr4i/edit?usp=drive_link", "_blank");
  const openGitHub = () => window.open("https://github.com/PravdeepK", "_blank");
  const openEmail = () => window.location.href = "mailto:pravdeepkk@gmail.com";
  const toggleProjects = () => setShowProjects(!showProjects);

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
        <div className="project-box" onClick={openGitHub}>
          <img src={project1Gif} alt="Project 1" className="project-img" />
          <div className="project-hover-text">Wordle Clone</div>
        </div>
        <div className="project-box" onClick={openGitHub}>
          <img src={project1Gif} alt="Project 1" className="project-img" />
          <div className="project-hover-text">Wordle Clone</div>
        </div>
        <div className="project-box" onClick={openGitHub}>
          <img src={project1Gif} alt="Project 1" className="project-img" />
          <div className="project-hover-text">Wordle Clone</div>
        </div>
        <div className="project-box" onClick={openGitHub}>
          <img src={project1Gif} alt="Project 1" className="project-img" />
          <div className="project-hover-text">Wordle Clone</div>
        </div>
      </div>
    </div>
  );
}

export default App;
