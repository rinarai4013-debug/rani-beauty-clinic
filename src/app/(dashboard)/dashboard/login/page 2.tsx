'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.displayName}!`);
      router.push('/dashboard');
    } catch {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rani-cream to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-gradient-to-br from-rani-navy to-rani-navy-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span className="text-2xl font-heading text-rani-gold">R</span>
          </motion.div>
          <h1 className="text-2xl font-heading text-rani-navy">RaniOS</h1>
          <p className="text-sm font-body text-rani-muted mt-1">Rani Beauty Clinic Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rani-border p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-rani-gold" />
            <span className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Sign In</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-rani-navy mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-2.5 text-sm font-body text-rani-navy border border-rani-border rounded-xl outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all placeholder:text-rani-muted/50"
              />
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-rani-navy mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 pr-10 text-sm font-body text-rani-navy border border-rani-border rounded-xl outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold transition-all placeholder:text-rani-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rani-muted hover:text-rani-navy transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-body font-semibold text-rani-navy bg-rani-gold hover:bg-rani-gold/90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-body text-rani-muted mt-6">
          Rani Beauty Clinic &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
