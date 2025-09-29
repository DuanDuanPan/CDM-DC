"use client";

import { useEffect, useState } from "react";
import { EBOM_BASELINES } from "./data";

export type EbomCompareFilter = "all" | "added" | "removed" | "modified";
export type EbomCompareDepth = number | "all";

interface EbomCompareState {
  leftBaseline: string;
  rightBaseline: string;
  filter: EbomCompareFilter;
  depth: EbomCompareDepth;
}

const STORAGE_KEY = "ebomCompareState";
const PARAM_LEFT = "ebomLeft";
const PARAM_RIGHT = "ebomRight";
const PARAM_FILTER = "ebomFilter";
const PARAM_DEPTH = "ebomDepth";

const DEFAULT_STATE: EbomCompareState = {
  leftBaseline: EBOM_BASELINES[0]?.id ?? "",
  rightBaseline: EBOM_BASELINES[1]?.id ?? EBOM_BASELINES[0]?.id ?? "",
  filter: "all",
  depth: "all",
};

type Listener = (state: EbomCompareState) => void;

let state: EbomCompareState = { ...DEFAULT_STATE };
const listeners = new Set<Listener>();
let initialized = false;

const parseFilter = (value: string | null): EbomCompareFilter | undefined => {
  if (!value) return undefined;
  if (value === "all" || value === "added" || value === "removed" || value === "modified") {
    return value;
  }
  return undefined;
};

const parseDepth = (value: string | null): EbomCompareDepth | undefined => {
  if (!value) return undefined;
  if (value === "all") return "all";
  const num = Number(value);
  if (Number.isFinite(num) && num >= 0) {
    return num as EbomCompareDepth;
  }
  return undefined;
};

const loadFromStorage = (): Partial<EbomCompareState> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<EbomCompareState>;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const loadFromSearch = (): Partial<EbomCompareState> => {
  if (typeof window === "undefined") return {};
  const search = new URLSearchParams(window.location.search);
  const left = search.get(PARAM_LEFT) ?? undefined;
  const right = search.get(PARAM_RIGHT) ?? undefined;
  const filter = parseFilter(search.get(PARAM_FILTER));
  const depth = parseDepth(search.get(PARAM_DEPTH));
  const next: Partial<EbomCompareState> = {};
  if (left) next.leftBaseline = left;
  if (right) next.rightBaseline = right;
  if (filter) next.filter = filter;
  if (depth !== undefined) next.depth = depth;
  return next;
};

const writeToStorage = (next: EbomCompareState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
};

const syncSearchParams = (next: EbomCompareState) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM_LEFT, next.leftBaseline);
  url.searchParams.set(PARAM_RIGHT, next.rightBaseline);
  url.searchParams.set(PARAM_FILTER, next.filter);
  if (next.depth === "all") url.searchParams.delete(PARAM_DEPTH);
  else url.searchParams.set(PARAM_DEPTH, String(next.depth));
  window.history.replaceState(window.history.state, "", url.toString());
};

const notify = () => {
  for (const listener of listeners) {
    listener(state);
  }
};

const initialise = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const fromStorage = loadFromStorage();
  const fromSearch = loadFromSearch();
  state = {
    ...state,
    ...fromStorage,
    ...fromSearch,
  };
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as EbomCompareState;
      state = { ...state, ...parsed };
      notify();
    } catch {}
  });
};

export function getEbomCompareState(): EbomCompareState {
  initialise();
  return state;
}

export function setEbomCompareState(partial: Partial<EbomCompareState>) {
  initialise();
  state = { ...state, ...partial };
  writeToStorage(state);
  syncSearchParams(state);
  notify();
}

export function useEbomCompareState(): [EbomCompareState, typeof setEbomCompareState] {
  initialise();
  const [value, setValue] = useState<EbomCompareState>(state);
  useEffect(() => {
    const listener: Listener = (next) => setValue(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return [value, setEbomCompareState];
}
