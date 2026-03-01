'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@/components/Editor';

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

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
        setIsReady(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  const fullName = user.full_name || 'User';
  const email = user.email || '';

  return <Editor documentId={documentId} fullName={fullName} email={email} userId={user.id} />;
}
