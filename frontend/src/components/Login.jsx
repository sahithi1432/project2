import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./login.css";

function Login(){
    const navigate=useNavigate();
    const[mail,setmail]=useState("");
    const[password,setpassword]=useState("");
    const[loading,setLoading]=useState(false);
    const[error,setError]=useState("");

    const handleSubmit=async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            const response = await authAPI.login({
                email: mail,
                password
            });
            

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            if (response.user && response.user.profile_photo) {
              localStorage.setItem('profilePhoto', response.user.profile_photo);
            } else {
              localStorage.removeItem('profilePhoto');
            }
            
            alert("Login successful!");
            navigate("/");
        } catch (error) {
            setError(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-label">Email</label>
                <input className="login-input" type="email" value={mail} onChange={(e)=>setmail(e.target.value)} placeholder="xxxx@gmail.com" required autoComplete="username" />
                <label className="login-label">Password</label>
                <input className="login-input" type="password" value={password} 
                onChange={(e)=>setpassword(e.target.value)} placeholder="Enter strong password" required autoComplete="current-password" />
                {error && <p className="login-error-message">{error}</p>}
                <button className="login-btn" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <p className="forgot-password-link">
                <Link to="/forgot-password" className="forgot-password-link-anchor">
                    Forgot Password?
                </Link>
            </p>
            <p className="signup-link">
                <span>Don't have an account? </span>
                <Link to="/Signup" className="signup-link-anchor">
                    Signup
                </Link>
            </p>
        </div>
    );
}
export default Login;