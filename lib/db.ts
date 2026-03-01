import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'collab-editor.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id)
  );

  CREATE INDEX IF NOT EXISTS idx_versions_doc ON document_versions(document_id, created_at DESC);
`);

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// User authentication functions
export const authDB = {
  // Sign up new user
  signUp: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {
      // Check if user exists
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Insert user
      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name)
        VALUES (?, ?, ?, ?)
      `).run(userId, email, passwordHash, fullName);

      const user: User = {
        id: userId,
        email,
        full_name: fullName,
        created_at: new Date().toISOString()
      };

      // Generate JWT token
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

      return { success: true, user, token };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Sign in existing user
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const user = db.prepare(`
        SELECT id, email, password_hash, full_name, created_at
        FROM users WHERE email = ?
      `).get(email) as any;

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      const userData: User = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at
      };

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      return { success: true, user: userData, token };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Verify JWT token
  verifyToken: (token: string): { userId: string; email: string } | null => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { userId: decoded.userId, email: decoded.email };
    } catch {
      return null;
    }
  },

  // Get user by ID
  getUserById: (userId: string): User | null => {
    try {
      const user = db.prepare(`
        SELECT id, email, full_name, created_at
        FROM users WHERE id = ?
      `).get(userId) as any;

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at
      };
    } catch {
      return null;
    }
  }
};

// Document functions
export const documentsDB = {
  // Get document by ID
  getDocument: (docId: string) => {
    try {
      const doc = db.prepare(`
        SELECT id, title, content, created_at, updated_at
        FROM documents WHERE id = ?
      `).get(docId) as any;

      if (!doc) return null;

      return {
        id: doc.id,
        title: doc.title,
        content: JSON.parse(doc.content),
        created_at: doc.created_at,
        updated_at: doc.updated_at
      };
    } catch {
      return null;
    }
  },

  // Create new document
  createDocument: (docId: string, title: string = 'Untitled Document', content: any = {}) => {
    try {
      db.prepare(`
        INSERT INTO documents (id, title, content)
        VALUES (?, ?, ?)
      `).run(docId, title, JSON.stringify(content));
      return true;
    } catch {
      return false;
    }
  },

  // Update document
  updateDocument: (docId: string, content: any, userId?: string) => {
    try {
      const contentStr = JSON.stringify(content);
      
      // Update main document
      db.prepare(`
        UPDATE documents
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(contentStr, docId);
      
      // Save version history
      db.prepare(`
        INSERT INTO document_versions (document_id, content, user_id)
        VALUES (?, ?, ?)
      `).run(docId, contentStr, userId || null);
      
      return true;
    } catch {
      return false;
    }
  },

  // Get document version history
  getVersionHistory: (docId: string, limit: number = 50) => {
    try {
      const versions = db.prepare(`
        SELECT v.id, v.content, v.created_at, u.full_name as user_name
        FROM document_versions v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.document_id = ?
        ORDER BY v.created_at DESC
        LIMIT ?
      `).all(docId, limit) as any[];

      return versions.map(v => ({
        id: v.id,
        content: JSON.parse(v.content),
        created_at: v.created_at,
        user_name: v.user_name || 'Unknown'
      }));
    } catch {
      return [];
    }
  },

  // Restore document to specific version (current content should be saved before calling this)
  restoreVersion: (docId: string, versionId: number) => {
    try {
      // Get the version to restore
      const version = db.prepare(`
        SELECT content FROM document_versions WHERE id = ?
      `).get(versionId) as any;

      if (!version) return false;

      // Restore the selected version
      db.prepare(`
        UPDATE documents
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(version.content, docId);

      return true;
    } catch {
      return false;
    }
  }
};

export default db;
