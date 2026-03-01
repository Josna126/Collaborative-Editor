'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@/components/Editor';

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as string;
  const [username, setUsername] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Get or create username
    let storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      storedUsername = `User ${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('username', storedUsername);
    }
    setUsername(storedUsername);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return <Editor documentId={documentId} username={username} />;
}
