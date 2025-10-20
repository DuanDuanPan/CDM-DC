import { NextRequest, NextResponse } from 'next/server';
import { notFound, readCsvRecords, serverError } from '../../utils';

export const dynamic = 'force-static';

export async function GET(_request: NextRequest, context: any) {
  const params = (await context.params) ?? {};
  const runParam = params.runId;
  const runId = Array.isArray(runParam) ? runParam[0] : runParam;

  if (!runId) {
    return notFound('RUN_NOT_FOUND');
  }

  try {
    const records = await readCsvRecords('attachments.csv');
    const data = records
      .filter((record) => record.run_id === runId)
      .map((record) => ({
        file_id: record.file_id,
        type: record.type,
        path: record.path,
        ts: record.ts,
        desc: record.desc,
        run_id: record.run_id,
      }));

    return NextResponse.json({ data });
  } catch (error) {
    return serverError(error);
  }
}
