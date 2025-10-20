import { listProjects, listTests, listRuns } from '@/services/tbom';
import TbomExplorerClient from '@/components/tbom/TbomExplorerClient';

type TbomPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TbomPage({ searchParams }: TbomPageProps) {
  const resolvedSearchParams: Record<string, string | string[] | undefined> =
    searchParams ? await searchParams : {};
  let projects = [] as Awaited<ReturnType<typeof listProjects>>;
  let tests = [] as Awaited<ReturnType<typeof listTests>>;
  let runs = [] as Awaited<ReturnType<typeof listRuns>>;
  let initialError: string | null = null;

  try {
    [projects, tests, runs] = await Promise.all([
      listProjects(),
      listTests(),
      listRuns(),
    ]);
  } catch (error) {
    console.warn('[TBOM] 页面数据加载失败', error);
    initialError = error instanceof Error ? error.message : '未知错误';
  }

  const params = {
    from: resolvedSearchParams?.from,
    node: resolvedSearchParams?.node,
    run: resolvedSearchParams?.run,
    path: resolvedSearchParams?.path,
  };

  return (
    <TbomExplorerClient
      projects={projects}
      tests={tests}
      runs={runs}
      initialParams={params}
      initialError={initialError}
    />
  );
}
