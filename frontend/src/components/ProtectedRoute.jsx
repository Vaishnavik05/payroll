import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        navigate('/');
        return;
      }

      // Check if user has the required role
      if (requiredRole) {
        const userData = JSON.parse(user);
        if (userData.role !== requiredRole) {
          navigate('/');
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [navigate, requiredRole]);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
