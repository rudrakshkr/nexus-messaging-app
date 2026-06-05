import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { TailSpin } from "react-loader-spinner";

export default function LoginPage({ setUser }) {
    const API_URL = import.meta.env.VITE_API_BASE_URL || "";

    // States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Banner Animation states
    const [showBanner, setShowBanner] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const successMessage = location.state?.successMessage;

    useEffect(() => {
        if(successMessage) {
            console.log(successMessage)
            setShowBanner(true);
            setIsFadingOut(false);

            const fadeTimer = setTimeout(() => {
                setIsFadingOut(true);
            }, 3000);

            const removeTimer = setTimeout(() => {
                setShowBanner(false);
                navigate(location.pathname, {replace: true, state: {}});
            }, 4000);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(removeTimer);
            }
        }
    }, [successMessage, navigate, location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors('');
        
        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password })
            });

            // Parse the json response
            const data = await res.json(); 

            if (!res.ok) {
                if (res.status === 401) setErrors('Invalid credentials');
                else setErrors(data.message || 'Please try again.');
            } 
            else {
                localStorage.setItem('jwtToken', data.token);

                setTimeout(() => {
                    navigate('/', { 
                        state: { successMessage: 'Welcome back! You successfully logged in.' }
                    });
                }, 10);

                if (setUser) {
                    setUser({ auth: true, email: data.email, id: data.id , avatar: data.avatar, fullname: data.fullname});
                }  
            }
        } catch (err) {
            setErrors('Network error. Is the backend running?');
        }
        finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a] justify-center items-center p-4 font-sans">
            {/* Display the success message if successful sign in */}
            {showBanner && (
                <div className="fixed top-8 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className={`px-4 py-3 bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg text-sm text-center font-medium shadow-2xl pointer-events-auto ${isFadingOut ? 'animate-fade-out' : 'animate-fade-down'}`}>
                        {successMessage}
                    </div>
                </div>
            )}
            <div className="w-full max-w-[460px] bg-[#161618] border border-[#2c2c2f] rounded-2xl p-8 sm:p-10 shadow-2xl opacity-0 animate-fade-up">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#8444f6] rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-5 shadow-[0_0_30px_rgba(132,68,246,0.5)]">
                        N
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-[#8f8f96] text-sm mt-2">Sign in to continue to Nexus</p>
                    </div>

                    {/* Display errors if they exist */}
                    {errors && <p className="text-sm font-medium text-destructive">{errors}</p>}

                    {/* Form Section */}
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-[#e1e1e3] mb-1.5">Email</label>
                            <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input 
                                type="email" 
                                id="email"
                                name="email"
                                required
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" 
                                className="w-full bg-[#18181b] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all" 
                            />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-[#e1e1e3] mb-1.5">Password</label>
                            <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input 
                                type="password" 
                                id="password"
                                name="password"
                                required
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" 
                                className="w-full bg-[#18181b] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all" 
                            />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex justify-center gap-4 w-full bg-[#8444f6] hover:bg-[#7434e6] text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                            >
                                {isSubmitting && (
                                    <TailSpin
                                        visible={true}
                                        height="20"
                                        width="20"
                                        color="#ffffff"
                                        ariaLabel="tail-spin-loading"
                                        radius="1"
                                    />
                                )}
                                {isSubmitting ? "Logging in..." : "Login"}
                            </button>
                        </div>
                    </form>

                    {/* Footer Link */}
                    <p className="text-center text-[#8f8f96] text-sm mt-8">
                    Don't have an account?{' '}
                    <a href="/sign-up" className="text-[#8444f6] font-medium hover:underline transition-all">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}