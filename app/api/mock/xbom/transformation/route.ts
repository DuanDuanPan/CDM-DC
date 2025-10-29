import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MOCK_PATH = path.join(process.cwd(), 'docs', 'mocks', 'xbom-transformation-overview.json');

export async function GET() {
  try {
    const content = await fs.readFile(MOCK_PATH, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'MOCK_TRANSFORMATION_NOT_AVAILABLE',
        message:
          error instanceof Error
            ? `无法读取 XBOM 转化概览 Mock 数据：${error.message}`
            : '无法读取 XBOM 转化概览 Mock 数据',
      },
      { status: 500 }
    );
  }
}
