/* eslint-disable no-console */
import process from 'node:process';
import { groupRunsByProject, listRunsByEbomNode, fetchTimeseries } from '../services/tbom';
import { ApiError } from '../services/http';

async function main() {
  const [, , baseArg] = process.argv;

  if (baseArg) {
    process.env.NEXT_PUBLIC_API_BASE = baseArg.replace(/\/$/, '');
  }

  if (!process.env.NEXT_PUBLIC_API_BASE) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE 未设置。请提供服务器地址，例如：npx ts-node scripts/verify-tbom-data.ts http://localhost:3100/api/mock',
    );
  }

  console.log(`TBOM 数据校验脚本\nBase URL: ${process.env.NEXT_PUBLIC_API_BASE}\n`);

  const groups = await groupRunsByProject();
  console.log(`项目数量：${groups.length}`);
  for (const { project, tests, runs } of groups) {
    console.log(
      `- ${project.project_id}《${project.title}》：试验 ${tests.length} 个，运行 ${runs.length} 次`,
    );
  }

  const targetEbom = 'EBN-ASSY-0001-003';
  const runsForEbom = await listRunsByEbomNode(targetEbom);
  console.log(
    `\n挂接至 ${targetEbom} 的运行：${runsForEbom.map((run) => run.run_id).join(', ') || '(无)'}`,
  );

  const timeseries = await fetchTimeseries('R-EX-001');
  const preview = timeseries.split(/\r?\n/).slice(0, 3).join('\n');
  console.log(`\nR-EX-001 时序预览:\n${preview}`);

  try {
    await fetchTimeseries('R-EX-999');
  } catch (error) {
    if (error instanceof ApiError) {
      console.log(`\n错误示例：请求不存在 run 时返回 ${error.status} → ${JSON.stringify(error.payload)}`);
    } else {
      throw error;
    }
  }
}

main().catch((error) => {
  console.error('TBOM 数据校验失败:', error);
  process.exit(1);
});
