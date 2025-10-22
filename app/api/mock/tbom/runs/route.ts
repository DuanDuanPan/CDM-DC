import { NextResponse } from 'next/server';
import { readJsonDataset, serverError } from '../utils';
import type { TbomRun } from '@/components/tbom/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runs = await readJsonDataset<TbomRun[]>('tbom_run');
    return NextResponse.json({ data: runs });
  } catch (error) {
    return serverError(error);
  }
}
