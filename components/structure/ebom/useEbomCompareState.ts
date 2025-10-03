"use client";

import { useEffect, useState } from "react";
import { EBOM_BASELINES } from "./data";

export type EbomCompareFilter = "all" | "added" | "removed" | "modified";
export type EbomCompareDepth = number | "all";
export type EbomOwnerFilter = "all" | string;

interface EbomCompareState {
  leftBaseline: string;
  rightBaseline: string;
  filter: EbomCompareFilter;
  depth: EbomCompareDepth;
  ownerFilter: EbomOwnerFilter;
  favorites: string[];
  recent: string[];
}

const STORAGE_KEY = "ebomCompareState";
const PARAM_LEFT = "ebomLeft";
const PARAM_RIGHT = "ebomRight";
const PARAM_FILTER = "ebomFilter";
const PARAM_DEPTH = "ebomDepth";
const PARAM_OWNER = "ebomOwner";

const DEFAULT_STATE: EbomCompareState = {
  leftBaseline: EBOM_BASELINES[0]?.id ?? "",
  rightBaseline: EBOM_BASELINES[1]?.id ?? EBOM_BASELINES[0]?.id ?? "",
  filter: "all",
  depth: "all",
  ownerFilter: "all",
  favorites: [],
  recent: [],
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
    if (!parsed) return {};
    if (!Array.isArray(parsed.favorites)) parsed.favorites = [];
    if (!Array.isArray(parsed.recent)) parsed.recent = [];
    if (parsed.ownerFilter && typeof parsed.ownerFilter !== "string") parsed.ownerFilter = "all";
    return parsed;
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
  const owner = search.get(PARAM_OWNER) ?? undefined;
  const next: Partial<EbomCompareState> = {};
  if (left) next.leftBaseline = left;
  if (right) next.rightBaseline = right;
  if (filter) next.filter = filter;
  if (depth !== undefined) next.depth = depth;
  if (owner) next.ownerFilter = owner;
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
  if (!next.ownerFilter || next.ownerFilter === "all") url.searchParams.delete(PARAM_OWNER);
  else url.searchParams.set(PARAM_OWNER, next.ownerFilter);
  window.history.replaceState(window.history.state, "", url.toString());
};

const sanitizeBaselines = (ids: string[]) => {
  const allowed = new Set(EBOM_BASELINES.map((b) => b.id));
  return ids.filter((id) => allowed.has(id));
};

const updateRecent = (current: string[], nextCandidates: string[]): string[] => {
  const allowed = new Set(EBOM_BASELINES.map((b) => b.id));
  const merged = [...nextCandidates, ...current];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of merged) {
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    unique.push(id);
    seen.add(id);
    if (unique.length >= 6) break;
  }
  return unique;
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
  state.favorites = sanitizeBaselines(state.favorites ?? []);
  state.recent = sanitizeBaselines(state.recent ?? []);
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
  const previous = state;
  const nextLeft = partial.leftBaseline ?? previous.leftBaseline;
  const nextRight = partial.rightBaseline ?? previous.rightBaseline;
  let recent = previous.recent;
  if (nextLeft !== previous.leftBaseline || nextRight !== previous.rightBaseline) {
    recent = updateRecent(previous.recent, [nextLeft, nextRight]);
  }
  state = {
    ...previous,
    ...partial,
    recent,
  };
  state.favorites = sanitizeBaselines(state.favorites ?? []);
  state.recent = sanitizeBaselines(state.recent ?? []);
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

export function toggleFavoriteBaseline(id: string) {
  initialise();
  const allowed = new Set(EBOM_BASELINES.map((b) => b.id));
  if (!allowed.has(id)) return;
  const favorites = new Set(state.favorites ?? []);
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  state = { ...state, favorites: Array.from(favorites) };
  writeToStorage(state);
  notify();
}

export function clearRecentBaselines() {
  initialise();
  state = { ...state, recent: [] };
  writeToStorage(state);
  notify();
}
