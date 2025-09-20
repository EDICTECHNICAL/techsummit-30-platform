"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    teamName: "",
    college: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationStatus, setRegistrationStatus] = useState<{
    isOpen: boolean;
    deadline?: string;
    message?: string;
  }>({ isOpen: true });

  // Check registration deadline on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetch('/api/registration-status');
        if (response.ok) {
          const status = await response.json();
          setRegistrationStatus(status);
        } else {
          // If endpoint fails, assume registration is open
          setRegistrationStatus({ isOpen: true });
        }
      } catch (err) {
        console.error('Failed to check registration status:', err);
        // If we can't check the status, assume registration is open
        setRegistrationStatus({ isOpen: true });
      }
    };

    checkRegistrationStatus();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      errors.username = "Username must be less than 50 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.teamName.trim()) {
      errors.teamName = "Team name is required";
    } else if (formData.teamName.length > 100) {
      errors.teamName = "Team name must be less than 100 characters";
    }

    if (!formData.college.trim()) {
      errors.college = "College is required";
    } else if (formData.college.length > 200) {
      errors.college = "College name must be less than 200 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          password: formData.password,
          teamName: formData.teamName.trim(),
          college: formData.college.trim(),
        })
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        setError(result.error || "Registration failed");
        return;
      }

      // Redirect to sign-in page with success message
      router.push("/sign-in?registered=true");
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && 
                     formData.password === formData.confirmPassword &&
                     Object.keys(fieldErrors).length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 event-section-bg">
      <div className="w-full max-w-md event-card event-card-hover rounded-xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold event-text-gradient">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join Techpreneur Summit 3.0</p>
        </div>

        {/* Registration Status */}
        {registrationStatus.message && (
          <div className={`mb-4 p-4 rounded-md border backdrop-blur-sm ${
            registrationStatus.isOpen 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <p className="text-sm font-medium">
              {registrationStatus.isOpen ? '🟢 Registration Open' : '🔴 Registration Closed'}
            </p>
            <p className="text-xs mt-1">{registrationStatus.message}</p>
          </div>
        )}

        {/* Registration Closed Message */}
        {!registrationStatus.isOpen ? (
          <div className="text-center space-y-4">
            <div className="event-card p-6 rounded-lg">
              <div className="text-4xl mb-2">⏰</div>
              <h2 className="text-xl font-semibold mb-2 text-primary">Registration Closed</h2>
              <p className="text-muted-foreground">
                The registration deadline has passed. New team registrations are no longer accepted.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary hover:underline font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
              >
                ← Back to Techpreneur Summit 3.0
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 rounded-md bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full rounded-md border bg-background/50 backdrop-blur-sm px-4 py-3 text-sm outline-none focus:ring-2 transition-all duration-300 ${
                fieldErrors.name 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className={`w-full rounded-md border bg-background/50 backdrop-blur-sm px-4 py-3 text-sm outline-none focus:ring-2 transition-all duration-300 ${
                fieldErrors.username 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Choose a unique username"
              disabled={loading}
            />
            {fieldErrors.username && <p className="text-xs text-destructive mt-1">{fieldErrors.username}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition-colors ${
                fieldErrors.password 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Create a secure password"
              disabled={loading}
            />
            {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition-colors ${
                fieldErrors.confirmPassword 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Confirm your password"
              disabled={loading}
            />
            {fieldErrors.confirmPassword && <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>}
          </div>
          
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-muted-foreground mb-1">
              Team Name *
            </label>
            <input
              id="teamName"
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => handleInputChange("teamName", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition-colors ${
                fieldErrors.teamName 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Choose your team name"
              disabled={loading}
            />
            {fieldErrors.teamName && <p className="text-xs text-destructive mt-1">{fieldErrors.teamName}</p>}
          </div>
          
          <div>
            <label htmlFor="college" className="block text-sm font-medium text-muted-foreground mb-1">
              College/University *
            </label>
            <input
              id="college"
              type="text"
              required
              value={formData.college}
              onChange={(e) => handleInputChange("college", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition-colors ${
                fieldErrors.college 
                  ? "border-destructive focus:ring-destructive" 
                  : "border-input focus:ring-primary focus:border-transparent"
              }`}
              placeholder="Your college or university name"
              disabled={loading}
            />
            {fieldErrors.college && <p className="text-xs text-destructive mt-1">{fieldErrors.college}</p>}
          </div>
          
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="event-button-primary w-full rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </p>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← Back to Home
          </Link>
        </div>
          </>
        )}
      </div>
    </div>
  );
}