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
    const records = await readCsvRecords('test_card.csv');
    const data = records
      .filter((record) => record.run_id === runId)
      .map((record) => ({
        run_id: record.run_id,
        param_name: record.param_name,
        value: record.value,
        unit: record.unit,
        source: record.source,
      }));

    if (data.length === 0) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return serverError(error);
  }
}
