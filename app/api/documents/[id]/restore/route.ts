import { NextRequest, NextResponse } from 'next/server';
import { documentsDB } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { versionId } = await request.json();
    
    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }
    
    const success = documentsDB.restoreVersion(documentId, versionId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to restore version' },
        { status: 400 }
      );
    }
    
    // Get the restored document
    const document = documentsDB.getDocument(documentId);
    
    return NextResponse.json({ success: true, content: document?.content });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
