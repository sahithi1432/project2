import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import "./signup.css";

function Signup(){
    const navigate=useNavigate();
    const location = useLocation();
    // Ensure 'from' is always a location object, not just a string
    const from = location.state?.from || { pathname: "/" };
    const[username,setusername]=useState("");
    const[mail,setmail]=useState("");
    const[password,setpassword]=useState("");
    const[repassword,setrepassword]=useState("");
    const[loading,setLoading]=useState(false);
    const[error,setError]=useState("");
    // OTP states
    const [step, setStep] = useState('form'); // 'form', 'otp'
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpMsg, setOtpMsg] = useState("");
    // Timer and resend
    const [otpTimer, setOtpTimer] = useState(600); // 10 min in seconds
    const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown
    const timerRef = useRef();
    const cooldownRef = useRef();

    useEffect(() => {
        if (step === 'otp' && otpSent && otpTimer > 0) {
            timerRef.current = setInterval(() => {
                setOtpTimer(t => t - 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [step, otpSent]);
    useEffect(() => {
        if (otpTimer <= 0 && step === 'otp') {
            setError('OTP expired. Please resend OTP.');
        }
    }, [otpTimer, step]);
    useEffect(() => {
        if (resendCooldown > 0) {
            cooldownRef.current = setInterval(() => {
                setResendCooldown(c => c - 1);
            }, 1000);
        }
        return () => clearInterval(cooldownRef.current);
    }, [resendCooldown]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!username || !mail || !password || !repassword) {
            setError("Please fill all fields");
            return;
        }
        if(password!==repassword){
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await authAPI.sendOtp(mail);
            setOtpSent(true);
            setStep('otp');
            setOtpMsg("OTP sent to your email");
            setOtpTimer(600); // reset timer
            setResendCooldown(30); // 30s cooldown
        } catch (err) {
            setError(err.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError("");
        setLoading(true);
        try {
            await authAPI.sendOtp(mail);
            setOtpMsg("OTP resent to your email");
            setOtpTimer(600);
            setResendCooldown(30);
        } catch (err) {
            setError(err.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handlesubmit=async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!otp || otpTimer <= 0) {
            setError("Please enter a valid OTP or resend if expired.");
            setLoading(false);
            return;
        }
        try {
            const response = await authAPI.signup({
                username,
                email: mail,
                password,
                otp
            });
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            alert("Signup successful!");
            navigate(from, { replace: true });
        } catch (error) {
            setError(error.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    // Format timer mm:ss
    const formatTimer = (t) => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;

    return(
        <div className="signup-container">
            <h2 className="signup-title">Signup Form</h2>
            {step === 'form' && (
            <form className="signup-form" onSubmit={handleSendOtp}>
                <label className="signup-label">Username:</label>
                <input className="signup-input" type="text" value={username}
                onChange={(e)=>setusername(e.target.value)} placeholder="Enter username" required disabled={otpSent} />
                <label className="signup-label">Email:</label>
                <input className="signup-input" type="email" value={mail}
                onChange={(e)=>setmail(e.target.value)} placeholder="Enter email" required disabled={otpSent} autoComplete="username" />
                <label className="signup-label">Password:</label>
                <input className="signup-input" type="password" value={password}
                onChange={(e)=>setpassword(e.target.value)} placeholder="Enter password" required disabled={otpSent} autoComplete="new-password" />
                <label className="signup-label">Re-enter password:</label>
                <input className="signup-input" type="password" value={repassword}
                onChange={(e)=>setrepassword(e.target.value)} placeholder="Re-enter password" required disabled={otpSent} autoComplete="new-password" />
                {error && <p className="signup-error-message">{error}</p>}
                <button className="signup-btn" type="submit" disabled={loading || otpSent}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                </button>
            </form>
            )}
            {step === 'otp' && (
            <form className="signup-form" onSubmit={handlesubmit}>
                <label className="signup-label">Enter OTP sent to your email:</label>
                <input className="signup-input" type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" required disabled={loading || otpTimer<=0} />
                <div className="signup-otp-row">
                  <span className="signup-otp-timer">Expires in: {formatTimer(otpTimer)}</span>
                  <button type="button" className="signup-btn signup-otp-resend" onClick={handleResendOtp} disabled={resendCooldown>0 || loading}>
                    {resendCooldown>0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
                {otpMsg && <p className="signup-otp-message">{otpMsg}</p>}
                {error && <p className="signup-error-message">{error}</p>}
                <button className="signup-btn" type="submit" disabled={loading || otpTimer<=0}>
                    {loading ? "Signing up..." : "Signup"}
                </button>
            </form>
            )}
            <p className="signup-login-link">Already have an account? <Link to="/Login">Login</Link></p>
        </div>
    );
}
export default Signup;