'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [documentId, setDocumentId] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/auth');
        return;
      }

      try {
        // Verify token
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!response.ok) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          router.push('/auth');
          return;
        }

        const data = await response.json();
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const createNewDocument = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    router.push(`/doc/${newId}`);
  };

  const joinDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!documentId.trim()) {
      setError('Please enter a document ID');
      return;
    }
    
    if (documentId.trim().length < 3) {
      setError('Document ID is too short');
      return;
    }
    
    router.push(`/doc/${documentId.trim()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const fullName = user?.full_name || 'User';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Collaborative Editor
            </h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-800"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
          <p className="text-gray-600">
            Welcome back, {firstName}!
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createNewDocument}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Create New Document
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <form onSubmit={joinDocument} className="space-y-3">
            <div>
              <input
                type="text"
                value={documentId}
                onChange={(e) => {
                  setDocumentId(e.target.value);
                  setError('');
                }}
                placeholder="Enter document ID (e.g., abc123xyz)"
                className={`w-full px-4 py-3 border ${
                  error ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400`}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Join Existing Document
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">How it works:</h2>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>Create a new document or join an existing one</li>
            <li>Share the document ID with your team</li>
            <li>Everyone can edit in real-time</li>
            <li>Changes are saved automatically</li>
          </ol>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Features:</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Real-time collaboration
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              See who's online
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Rich text formatting
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Typing indicators
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
