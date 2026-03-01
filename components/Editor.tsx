'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface EditorProps {
  documentId: string;
  username: string;
}

interface User {
  id: string;
  username: string;
}

export default function Editor({ documentId, username }: EditorProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const isRemoteUpdate = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start typing your document here...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  });

  // Load document from localStorage
  useEffect(() => {
    if (editor) {
      const savedContent = localStorage.getItem(`doc-${documentId}`);
      if (savedContent) {
        try {
          editor.commands.setContent(JSON.parse(savedContent));
          const savedTime = localStorage.getItem(`doc-${documentId}-saved`);
          if (savedTime) {
            setLastSaved(new Date(savedTime));
          }
        } catch (e) {
          console.error('Failed to load saved content:', e);
        }
      }
    }
  }, [documentId, editor]);

  // Setup WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      newSocket.emit('join-document', documentId, username);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('user-joined', (data: { userId: string; username: string; users: User[] }) => {
      console.log('User joined:', data);
      if (data.users) {
        setUsers(data.users);
      }
    });

    newSocket.on('user-left', (data: { userId: string; users: User[] }) => {
      console.log('User left:', data);
      if (data.users) {
        setUsers(data.users);
      }
    });

    newSocket.on('document-update', (data: { content: any; userId: string }) => {
      if (editor && data.userId !== newSocket.id) {
        isRemoteUpdate.current = true;
        const { from, to } = editor.state.selection;
        editor.commands.setContent(data.content, false);
        // Restore cursor position
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          // Position might be invalid
        }
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 50);
      }
    });

    newSocket.on('typing-indicator', (data: { userId: string; isTyping: boolean; username: string }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.username);
        } else {
          next.delete(data.username);
        }
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [documentId, username, editor]);

  // Handle editor updates
  useEffect(() => {
    if (!editor || !socket) return;

    let typingTimeout: NodeJS.Timeout;
    let saveTimeout: NodeJS.Timeout;

    const handleUpdate = () => {
      // Skip if this update came from a remote user
      if (isRemoteUpdate.current) {
        return;
      }
      
      const content = editor.getJSON();
      
      // Emit typing indicator
      socket.emit('typing-indicator', {
        documentId,
        isTyping: true,
        username
      });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing-indicator', {
          documentId,
          isTyping: false,
          username
        });
      }, 1000);

      // Broadcast update
      socket.emit('document-update', {
        documentId,
        content
      });

      // Save to localStorage (debounced)
      clearTimeout(saveTimeout);
      setIsSaving(true);
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem(`doc-${documentId}`, JSON.stringify(content));
          localStorage.setItem(`doc-${documentId}-saved`, new Date().toISOString());
          setLastSaved(new Date());
        } catch (err) {
          console.error('Failed to save:', err);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      clearTimeout(typingTimeout);
      clearTimeout(saveTimeout);
    };
  }, [editor, socket, documentId, username]);

  const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  const copyDocumentId = () => {
    navigator.clipboard.writeText(documentId);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Collaborative Editor</h1>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-gray-600">Doc ID:</span>
                <code className="text-xs font-mono text-gray-800">{documentId}</code>
                <button
                  onClick={copyDocumentId}
                  className="ml-1 text-indigo-600 hover:text-indigo-700 transition"
                  title="Copy document ID"
                >
                  {showCopied ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : lastSaved ? (
                  `Saved ${lastSaved.toLocaleTimeString()}`
                ) : (
                  'Not saved yet'
                )}
              </div>
            </div>
            
            {/* Active Users */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active users ({users.length}):</span>
              <div className="flex -space-x-2">
                {users.length === 0 ? (
                  <span className="text-sm text-gray-400 ml-2">No other users</span>
                ) : (
                  users.map((user, index) => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                      style={{ backgroundColor: userColors[index % userColors.length] }}
                      title={user.username}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-2 border-t pt-3">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('bold')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium italic transition ${
                editor.isActive('italic')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium line-through transition ${
                editor.isActive('strike')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Strikethrough"
            >
              S
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Heading 3"
            >
              H3
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('bulletList')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Bullet List"
            >
              • List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('orderedList')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Numbered List"
            >
              1. List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('blockquote')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Quote"
            >
              " Quote
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                editor.isActive('codeBlock')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Code Block"
            >
              {'</>'}
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Typing Indicators */}
      {typingUsers.size > 0 && (
        <div className="fixed bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </p>
        </div>
      )}
    </div>
  );
}
