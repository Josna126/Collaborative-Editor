import { NextRequest, NextResponse } from 'next/server';
import { documentsDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const versions = documentsDB.getVersionHistory(documentId);
    
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
