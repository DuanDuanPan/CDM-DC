import { NextResponse } from 'next/server';
import { readJsonDataset, serverError } from '../utils';
import type { TbomProject } from '@/components/tbom/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await readJsonDataset<TbomProject[]>('tbom_project');
    return NextResponse.json({ data: projects });
  } catch (error) {
    return serverError(error);
  }
}
