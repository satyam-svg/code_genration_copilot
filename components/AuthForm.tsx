"use client";

import { useState } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { AuthService, type SignupData, type LoginData } from "@/lib/api";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password,
        };

        const response = await AuthService.login(loginData);

        if (response.success) {
          // Redirect to chat on successful login
          router.push("/chat");
        } else {
          setError(response.message || "Login failed. Please try again.");
        }
      } else {
        // Signup flow
        const signupData: SignupData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

        const response = await AuthService.signup(signupData);

        if (response.success) {
          // Redirect to chat on successful signup
          router.push("/chat");
        } else {
          setError(response.message || "Signup failed. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isLogin
            ? "Enter your credentials to access your account"
            : "Sign up to get started with our platform"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required={!isLogin}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider ml-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="name@example.com"
            required
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider ml-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={isLogin ? 1 : 8}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {!isLogin && (
            <p className="text-xs text-zinc-500 ml-1">
              Must be at least 8 characters
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isLogin ? "Signing In..." : "Creating Account..."}
            </span>
          ) : (
            <>{isLogin ? "Sign In" : "Create Account"}</>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-400 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            disabled={loading}
            className="text-white font-medium hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
