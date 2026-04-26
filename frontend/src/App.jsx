import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import './index.css';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Login';
import SignupForm from './pages/SignIn';
import ChatPage from './pages/ChatPage';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    if(savedUser) {
      return JSON.parse(savedUser);
    }
    return { auth: false, fullname: '' }
  });

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(user));
  }, [user])

  return (
    <BrowserRouter>
      <div className='App'>
        <Routes>
          
          {/* Public Route: Login */}
          <Route 
            path="/login" 
            element={user.auth ? <Navigate to="/profile" /> : <LoginPage setUser={setUser} />} 
          />
          
          {/* Public Route: Sign Up */}
          <Route 
            path="/sign-up" 
            element={user.auth ? <Navigate to="/profile" /> : <SignupForm />} 
          />

          {/* Protected Route: Chat Page */}
          <Route 
            path="/" 
            element={user.auth ? <ChatPage user={user} setUser={setUser} /> : <LoginPage setUser={setUser} />}  
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
