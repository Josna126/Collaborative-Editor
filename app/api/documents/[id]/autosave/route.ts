import { NextRequest, NextResponse } from 'next/server';
import { documentsDB } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Check if document exists, create if not
    const existing = documentsDB.getDocument(documentId);
    if (!existing) {
      documentsDB.createDocument(documentId, 'Untitled Document', content);
    } else {
      // Update document WITHOUT creating version history
      const db = require('@/lib/db').default;
      db.prepare(`
        UPDATE documents
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(content), documentId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
