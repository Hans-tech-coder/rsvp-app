'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { createSessionCookie } from '@/app/actions/auth';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await createSessionCookie(idToken);
      
      if (res.success) {
        router.refresh();
        router.push('/admin/dashboard');
      } else {
        setError(res.error || 'Failed to create session');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8 transition-colors duration-200">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-gray-900 dark:text-zinc-100" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Admin Portal</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Secure access for event management</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
              placeholder="admin@wedding.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-2 shadow-lg shadow-gray-900/20 dark:shadow-white/10"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
