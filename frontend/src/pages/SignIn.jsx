import { useNavigate } from "react-router";
import { TailSpin } from "react-loader-spinner";
import { useForm } from "react-hook-form";

export default function CreateAccount() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: {errors, isSubmitting},
  } = useForm();

  const passwordValue = watch("password", "");

  // Helper function to calculate password strength
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    
    // Check length
    if (pass.length >= 8) score += 1;
    // Check for mixed case or letters + numbers
    if (/[a-z]/.test(pass) && /[A-Z0-9]/.test(pass)) score += 1;
    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    
    return score;
  };

  const strengthScore = calculateStrength(passwordValue);

  // Map the score
  const getStrengthUI = (score) => {
    switch (score) {
      case 1:
        return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3', textColor: 'text-red-500' };
      case 2:
        return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/3', textColor: 'text-yellow-500' };
      case 3:
        return { label: 'Strong', color: 'bg-green-500', width: 'w-full', textColor: 'text-green-500' };
      default:
        return { label: '', color: 'bg-transparent', width: 'w-0', textColor: 'text-transparent' };
    }
  };

  const { label, color, width, textColor } = getStrengthUI(strengthScore);
  
  const onSubmit = async (formData) => {
    console.log('Form submitted:', formData);
    
    try {
        const res = await fetch(`${API_URL}/api/sign-up`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullname: formData.fullname,
              email: formData.email,
              password: formData.password
            })
        });

        const data = await res.json();

        if(!res.ok) {
            if(res.status === 400) {
                if(data.errors && data.errors.length !== 0) {
                    setError("root", {type: "server", message: data.errors[0].msg})
                }
                else if(data.message) {
                    setError("root", {type: "server", message: data.message})
                }
            }
            else {
                setError("root", {type: "server", message: "Something went wrong. Please try again."});
            }
        } else {
            // Success
            // Redirect to login page
            navigate('/login', {
                state: {successMessage: "Sign up successful! Please log in."}
            });
        }
    } catch(err) {
        console.error("Fetch error: ", err);
        setError("root", {type: "server", message: "Failed to connect to the server."});
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a] justify-center items-center p-4 font-sans">
      <div className="w-full max-w-[460px] bg-[#161618] border border-[#2c2c2f] rounded-2xl p-8 sm:p-10 shadow-2xl opacity-0 animate-fade-up">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#8444f6] rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-5 shadow-[0_0_30px_rgba(132,68,246,0.5)]">
            N
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-[#8f8f96] text-sm mt-2">Get started with Nexus</p>
        </div>

        {/* Form Section */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

          {/* Server error display */}
          {errors.root && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-500 text-center">
              {errors.root.message}
            </div>
          )} 

          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium text-[#e1e1e3] mb-1.5">Full name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                type="text" 
                id="fullname"
                name="fullname"
                {...register("fullname", {
                  required: "Full Name is required",
                  maxLength: {
                    value: 30,
                    message: "Name cannot exceed 30 characters",
                  },
                })}
                placeholder="Alex Chen" 
                className={
                  `w-full bg-[#1e1e1e] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all
                  ${errors.fullname ? "border-red-500 focus:border-red-500" : "border-[#2c2c2f] focus:border-[#8444f6]"} `
                }
              />
            </div>
            {/* Name Errors  */}
            {errors.fullname && (
              <span className="text-red-400 text-sm">{errors.fullname.message}</span>
            )}
          </div>

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
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Email format is invalid",
                  },
                })}
                placeholder="you@example.com" 
                className={
                  `w-full bg-[#1e1e1e] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all
                  ${errors.email ? "border-red-500 focus:border-red-500" : "border-[#2c2c2f] focus:border-[#8444f6]"}`
                } 
              />
            </div>
            {/* Email errors  */}
            {errors.email && (
              <span className="text-red-400 text-sm">{errors.email.message}</span>
            )}
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
                {...register('password', {
                    required: 'Password is required',
                    minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters long'
                    },
                    maxLength: {
                      value: 25,
                      message: 'Password cannot be more than 25 characters long'
                    }
                })}
                placeholder="••••••••" 
                className={
                  `w-full bg-[#1e1e1e] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all
                  ${errors.password ? "border-red-500 focus:border-red-500" : "border-[#2c2c2f] focus:border-[#8444f6]"}`
                } 
              />
            </div>
            {/* Password errors  */}
            {errors.password && (
                <span className="text-red-400 text-sm">
                    {errors.password.message}
                </span>
            )}
          </div>

          {/* Live Strength Indicator */}
          {passwordValue.length > 0 && (
            <div className="mt-2.5 animate-fade-up">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#8f8f96] font-medium">Password strength</span>
                <span className={`font-semibold ${textColor}`}>{label}</span>
              </div>
              <div className="h-1 w-full bg-[#2c2c2f] rounded-full overflow-hidden">
                <div className={`h-full ${color} ${width} transition-all duration-300 ease-out`}></div>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-[#e1e1e3] mb-1.5">Confirm password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                type="password" 
                id="confirmPassword"
                name="confirmPassword"
                {...register('confirmPassword', {
                    required: 'Confirm Password is required',
                    validate: (value) =>
                        value === passwordValue|| 'Passwords do not match'
                })}
                placeholder="••••••••" 
                className={
                  `w-full bg-[#1e1e1e] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all
                  ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-[#2c2c2f] focus:border-[#8444f6]"}`
                }  
              />
            </div>
            {/* Confirm Password Errors  */}
            {errors.confirmPassword && (
                <span className="text-red-400 text-sm">
                    {errors.confirmPassword.message}
                </span>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#8444f6] hover:bg-[#7434e6] disabled:bg-[#8444f6]/50 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-semibold transition-colors flex justify-center items-center gap-4"
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
              <span>{isSubmitting ? "Please wait..." : "Create Account"}</span>
            </button>
          </div>
        </form>
        
        {/* Footer Link */}
        <p className="text-center text-[#8f8f96] text-sm mt-8">
          Already have an account?{' '}
          <a href="/login" className="text-[#8444f6] font-medium hover:underline transition-all">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}