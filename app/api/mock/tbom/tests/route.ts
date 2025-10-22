import { NextResponse } from 'next/server';
import { readJsonDataset, serverError } from '../utils';
import type { TbomTest } from '@/components/tbom/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tests = await readJsonDataset<TbomTest[]>('tbom_test');
    return NextResponse.json({ data: tests });
  } catch (error) {
    return serverError(error);
  }
}
