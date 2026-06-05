import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import './index.css';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Login';
import SignupForm from './pages/SignIn';
import ChatPage from './pages/ChatPage';
import EditProfile from './components/EditProfile';
import { jwtDecode } from 'jwt-decode';

function AuthWrapper({children}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    return savedUser ? JSON.parse(savedUser) : {auth: false, email: '', id: null, avatar: '', fullname: ''};
  });

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    if(token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        const timeUntilExpiry = (decodedToken.exp - currentTime) * 1000;

        if(timeUntilExpiry <= 0) {
          handleLogout();
        } else {
          const logoutTimer = setTimeout(() => {
            alert("Your session has expired. Please log in again.");
            handleLogout();
          }, timeUntilExpiry);

          return () => clearTimeout(logoutTimer);
        }
      } catch(err) {
        console.error("Invalid token format: ", err);
        handleLogout();
      }
    }
  }, [user.auth]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userData");
    setUser({auth: false, email: '', id: null, avatar: '', fullname: ''});
    navigate("/login");
  };

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(user));
  }, [user]);

  return (
    <Routes>
          
      {/* Public Route: Login */}
      <Route 
        path="/login" 
        element={user.auth ? <Navigate to="/" /> : <LoginPage setUser={setUser} />} 
      />
      
      {/* Public Route: Sign Up */}
      <Route 
        path="/sign-up" 
        element={user.auth ? <Navigate to="/" /> : <SignupForm />} 
      />

      <Route 
        path='/profile'
        element={user.auth ? <EditProfile to="/profile" user={user} setUser={setUser}/> : <SignupForm />}
      />

      {/* Protected Route: Chat Page */}
      <Route 
        path="/" 
        element={user.auth ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/login" />}  
      />

      {/* Catch All  */}
      <Route 
        path="*" 
        element={user.auth ? <Navigate to="/" /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <AuthWrapper />
      </div>
    </BrowserRouter>
  );
}

export default App
