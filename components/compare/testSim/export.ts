import type { TestSimChannel, TestSimRun } from './types';

export function exportChannelsToCsv(runs: TestSimRun[], channels: TestSimChannel[]) {
  if (!channels.length || !runs.length) {
    return;
  }
  const rows: string[][] = [];
  rows.push([
    'timestamp',
    ...channels.map((channel) =>
      channel.runLabel ? `${channel.runLabel} · ${channel.channel}` : channel.channel,
    ),
  ]);
  const allTs = Array.from(
    new Set(
      channels.flatMap((channel) => channel.samples.map((sample) => sample.ts)),
    ),
  ).sort((a, b) => a - b);

  allTs.forEach((ts) => {
    const date = new Date(ts).toISOString();
    const row: string[] = [date];
    channels.forEach((channel) => {
      const sample = channel.samples.find((item) => item.ts === ts);
      row.push(sample ? sample.value.toFixed(6) : '');
    });
    rows.push(row);
  });

  const content = rows.map((line) => line.join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'compare-test-sim.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
