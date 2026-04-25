export default function LoginPage({ setUser }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a] justify-center items-center p-4 font-sans">
      <div className="w-full max-w-[460px] bg-[#161618] border border-[#2c2c2f] rounded-2xl p-8 sm:p-10 shadow-2xl opacity-0 animate-fade-up">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#8444f6] rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-5 shadow-[0_0_30px_rgba(132,68,246,0.5)]">
            N
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-[#8f8f96] text-sm mt-2">Sign in to continue to Nexus</p>
        </div>

        {/* Form Section */}
        <form className="flex flex-col gap-4">
          
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
                placeholder="••••••••" 
                className="w-full bg-[#18181b] border border-[#2c2c2f] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#8444f6] transition-all" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button 
              type="submit"
              className="w-full bg-[#8444f6] hover:bg-[#7434e6] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            >
              Log in
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