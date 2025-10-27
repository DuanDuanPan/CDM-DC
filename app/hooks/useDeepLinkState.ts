'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DOMAIN_TO_MODULE: Record<string, string> = {
  requirement: 'structure',
  ebom: 'structure',
  simulation: 'structure',
  physical: 'dashboard',
};

export function useDeepLinkState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromParam = searchParams.get('from');
  const moduleParam = searchParams.get('module');
  const domainParam = searchParams.get('domain');
  const deepLinkNode = searchParams.get('node');
  const deepLinkPath = searchParams.get('path');
  const requirementParam = searchParams.get('requirementId');
  const simulationParam = searchParams.get('simulationRef');
  const assetParam = searchParams.get('assetSn');
  const tbomProjectParam = searchParams.get('tbomProject');
  const tbomTestParam = searchParams.get('tbomTest');
  const tbomRunParam = searchParams.get('tbomRun');

  const initialModule = useMemo(() => {
    if (moduleParam) return moduleParam;
    if (fromParam === 'tbom' && domainParam && DOMAIN_TO_MODULE[domainParam]) {
      return DOMAIN_TO_MODULE[domainParam];
    }
    if (fromParam === 'ebom') return 'structure';
    return 'dashboard';
  }, [domainParam, fromParam, moduleParam]);

  const [activeModule, setActiveModule] = useState(initialModule);

  const deepLinkKey = useMemo(
    () =>
      [
        moduleParam ?? '',
        fromParam ?? '',
        domainParam ?? '',
        deepLinkNode ?? '',
        requirementParam ?? '',
        simulationParam ?? '',
        assetParam ?? '',
      ].join('|'),
    [assetParam, domainParam, deepLinkNode, fromParam, moduleParam, requirementParam, simulationParam],
  );

  const deepLinkKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const desiredModule =
      moduleParam ??
      (fromParam === 'tbom' && domainParam && DOMAIN_TO_MODULE[domainParam]
        ? DOMAIN_TO_MODULE[domainParam]
        : undefined) ??
      (fromParam === 'ebom' ? 'structure' : undefined);

    if (!desiredModule) {
      deepLinkKeyRef.current = deepLinkKey;
      return;
    }

    if (deepLinkKeyRef.current !== deepLinkKey) {
      deepLinkKeyRef.current = deepLinkKey;
      if (desiredModule !== activeModule) {
        setActiveModule(desiredModule);
      }
    }
  }, [activeModule, deepLinkKey, domainParam, fromParam, moduleParam]);

  const tbomDeepLink = useMemo(
    () => ({
      from: fromParam,
      domain: domainParam,
      node: deepLinkNode,
      path: deepLinkPath,
      requirementId: requirementParam,
      simulationRef: simulationParam,
      assetSn: assetParam,
      projectId: tbomProjectParam,
      testId: tbomTestParam,
      runId: tbomRunParam,
    }),
    [
      assetParam,
      deepLinkNode,
      deepLinkPath,
      domainParam,
      fromParam,
      requirementParam,
      simulationParam,
      tbomProjectParam,
      tbomRunParam,
      tbomTestParam,
    ],
  );

  const isFromEbom = fromParam === 'ebom';
  const badgeCount = deepLinkNode ? 3 : 0;

  const tbomHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('from', 'ebom');
    if (deepLinkNode) params.set('node', deepLinkNode);
    if (deepLinkPath) params.set('path', deepLinkPath);
    return `/tbom${params.toString() ? `?${params.toString()}` : ''}`;
  }, [deepLinkNode, deepLinkPath]);

  const openTbom = useCallback(() => {
    router.push(tbomHref);
  }, [router, tbomHref]);

  const handleModuleChange = useCallback((module: string) => {
    setActiveModule(module);
  }, []);

  return {
    activeModule,
    handleModuleChange,
    tbomDeepLink,
    isFromEbom,
    badgeCount,
    openTbom,
  };
}
