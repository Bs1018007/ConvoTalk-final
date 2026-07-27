import React, { useState } from "react";
import { AuthStore } from "../store/AuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { FcGoogle } from "react-icons/fc"; 

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loginWithGoogle, isLoggingIn } = AuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
    await login({ email, password });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="z-10 flex flex-col items-center text-center px-6 space-y-6">
          <MessageSquare className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold">New Here?</h1>
          <p className="text-white/80">
            Sign up now and start connecting with people instantly.
          </p>
          <button className="px-6 py-2 bg-white text-blue-500 rounded-full font-semibold transition hover:bg-gray-200">
            <a href="/signup" className="text-blue-500 font-medium hover:underline">
              Sign Up
            </a>
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="w-10 h-10 text-primary" />
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-gray-600">Log in to continue</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-600 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-100 transition"
          >
            <FcGoogle className="w-5 h-5" /> 
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
