import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Createaltar from "./components/Createaltar";
import Profile from "./components/Profile";
import ForgotPassword from "./components/ForgotPassword";
import Admin from "./components/Admin";
import ViewAltar from "./components/ViewAltar";
import ManageSubscriptions from "./components/ManageSubscriptions";
import BillingHistory from "./components/BillingHistory";
import DebugRoute from "./components/DebugRoute";
import { AlertProvider } from "./context/AlertContext";
import "./App.css";


// Auto-logout component wrapper
function AutoLogoutWrapper({ children }) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const TIMEOUT_MINUTES = 60; // 1 hour
  const WARNING_MINUTES = 55; // Show warning 5 minutes before logout
  const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;
  const WARNING_MS = WARNING_MINUTES * 60 * 1000;

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Only set timer if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Set warning timeout (5 minutes before logout)
      warningTimeoutRef.current = setTimeout(() => {
        const shouldContinue = window.confirm(
          'You have been inactive for 55 minutes. You will be automatically logged out in 5 minutes. Click OK to stay logged in.'
        );
        if (shouldContinue) {
          resetTimer(); // Reset timer if user chooses to stay
        }
      }, WARNING_MS);

      // Set logout timeout
      timeoutRef.current = setTimeout(() => {
        // Auto logout after timeout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use a more user-friendly message
        const event = new CustomEvent('showAlert', {
          detail: {
            type: 'warning',
            message: 'You have been automatically logged out due to inactivity. Please log in again to continue.',
            duration: 8000
          }
        });
        document.dispatchEvent(event);
        navigate('/Login');
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Reset timer on mount if user is logged in
    resetTimer();

    // Event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [navigate]);

  return children;
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    // Redirect to login if not authenticated
    return <Navigate to="/Login" replace />;
  }
  
  return children;
}

// Global authentication check function
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    // Clear any remaining data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/Login';
    return false;
  }
  
  return true;
};

function App(){
  return(
    <div className="app-container">
      <AlertProvider>
        <Router>
          <AutoLogoutWrapper>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Signup" element={<Signup />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/Createaltar" element={
                <ProtectedRoute>
                  <Createaltar />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/viewaltar/:id" element={
                <ProtectedRoute>
                  <ViewAltar />
                </ProtectedRoute>
              } />
              <Route path="/subscriptions" element={
                <ProtectedRoute>
                  <ManageSubscriptions />
                </ProtectedRoute>
              } />
              <Route path="/billing-history" element={
                <ProtectedRoute>
                  <BillingHistory />
                </ProtectedRoute>
              } />
              
              {/* Public Routes - No Authentication Required */}
              <Route path="/altar/shared/:token" element={<ViewAltar />} />
              <Route path="/altar/edit/:editToken" element={<Createaltar editModeShare={true} />} />
              
              {/* Debug Route */}
              <Route path="/debug" element={<DebugRoute />} />
            </Routes>
          </AutoLogoutWrapper>
        </Router>
      </AlertProvider>
    </div>
  );
}
export default App;