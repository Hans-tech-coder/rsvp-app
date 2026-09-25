'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { createSessionCookie } from '@/app/actions/auth';
import { Loader2, ShieldCheck } from 'lucide-react';

// The user closed the popup or opened a second one; not worth an error box.
const QUIET_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // A popup, not a redirect: the redirect flow breaks when the browser blocks
  // third-party cookies on a *.vercel.app domain.
  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
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
      if (!QUIET_ERRORS.includes(err?.code)) {
        console.error(err);
        setError(err?.code === 'auth/popup-blocked'
          ? 'The sign-in popup was blocked. Allow popups for this site and try again.'
          : err.message || 'Sign-in failed');
      }
      await auth.signOut().catch(() => {});
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

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-lg shadow-gray-900/20 dark:shadow-white/10"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
