import { TypeAnimation } from "react-type-animation";
import "../styles/styles.css"; // Import the CSS file

const TypingAnimation = () => {
  return (
    <div className="typing-container">
      <TypeAnimation
        sequence={[
          "Hi, I'm Pravdeep,", 2000,
          "I'm a junior front-end developer.", 2000,
          "Welcome to my website!", 2000,
        ]}
        wrapper="span"
        speed={60}
        cursor={false}
        repeat={Infinity}
      />
    </div>
  );
};

export default TypingAnimation;
