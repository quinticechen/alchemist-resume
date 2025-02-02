import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/lovable-uploads/646b205a-7bc6-432d-b8bc-f002fe2db329.png" 
        alt="ResumeAlchemist" 
        className="h-8"
      />
    </Link>
  );
};

export default Logo;