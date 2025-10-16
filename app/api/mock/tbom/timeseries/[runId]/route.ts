import { NextRequest, NextResponse } from 'next/server';
import { notFound, readTextFile, serverError } from '../../utils';

const TIMESERIES_MAP: Record<string, string> = {
  'R-EX-001': 'result_timeseries.csv',
};

export const dynamic = 'force-static';

export async function GET(_request: NextRequest, context: any) {
  const params = (await context.params) ?? {};
  const runParam = params.runId;
  const runId = Array.isArray(runParam) ? runParam[0] : runParam;

  if (!runId) {
    return notFound('RUN_NOT_FOUND');
  }
  const fileName = TIMESERIES_MAP[runId];

  if (!fileName) {
    return notFound('RUN_NOT_FOUND');
  }

  try {
    const csv = await readTextFile(fileName);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
