import { useState } from "react";
import "./styles/styles.css";
import TypingAnimation from "./components/TypingAnimation";
import project1Gif from "./assets/project01.gif"; 
import project2Gif from "./assets/project02.gif"; 

function App() {
  const [showProjects, setShowProjects] = useState(false);

  // Function to open links
  const openResume = () => window.open("https://docs.google.com/document/d/1-scnARFnWeOxU5molGo561xV4tMgvr4i/edit?usp=drive_link", "_blank");
  const openGitHub = () => window.open("https://github.com/PravdeepK", "_blank");
  const openEmail = () => window.location.href = "mailto:pravdeepkk@gmail.com";
  const toggleProjects = () => setShowProjects(!showProjects);
  const openProject1 = () => window.open("https://wordle-p1.vercel.app/", "_blank");
  const openProject2 = () => window.open("https://www.rebel-snow.com/", "_blank");

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
        <div className="project-box" onClick={openProject1}>
          <img src={project1Gif} alt="Project 1" className="project-img" />
          <div className="project-hover-text">Wordle Clone</div>
        </div>
        <div className="project-box" onClick={openProject2}>
          <img src={project2Gif} alt="Project 2" className="project-img" />
          <div className="project-hover-text">Rebel Snow Website</div>
        </div>
      </div>
    </div>
  );
}

export default App;