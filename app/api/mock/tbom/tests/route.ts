import { NextResponse } from 'next/server';
import { readJsonFile, serverError } from '../utils';

type TbomTest = {
  test_id: string;
};

export const dynamic = 'force-static';

export async function GET() {
  try {
    const tests = await readJsonFile<TbomTest[]>('tbom_test.json');
    return NextResponse.json({ data: tests });
  } catch (error) {
    return serverError(error);
  }
}
