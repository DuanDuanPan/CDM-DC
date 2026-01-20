import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DOC_MAP: Record<string, string> = {
  'xbom-transformation': 'xbom-transformation-mechanism.md',
};

export async function GET(
  _: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const fileName = DOC_MAP[docId];
  if (!fileName) {
    return NextResponse.json({ error: 'DOC_NOT_FOUND' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'docs', fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'DOC_READ_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
