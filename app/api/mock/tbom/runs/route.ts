import { NextResponse } from 'next/server';
import { readJsonFile, serverError } from '../utils';

type TbomRun = {
  run_id: string;
};

export const dynamic = 'force-static';

export async function GET() {
  try {
    const runs = await readJsonFile<TbomRun[]>('tbom_run.json');
    return NextResponse.json({ data: runs });
  } catch (error) {
    return serverError(error);
  }
}
