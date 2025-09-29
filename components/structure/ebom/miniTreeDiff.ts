import type { EbomTreeNode } from "./types";

export type MiniTreeDiffType = "same" | "added" | "removed" | "modified";

export interface MiniTreeFlatNode {
  id: string;
  name: string;
  depth: number;
  path: string[];
  partNumber?: string;
  rev?: string;
  qty?: number;
  findNo?: string;
  uom?: string;
  lifecycle?: string;
  effectivity?: EbomTreeNode["effectivity"];
  substitutes?: EbomTreeNode["substitutes"];
}

export interface MiniTreeDiffDetail {
  key: string;
  label: string;
  left: string;
  right: string;
}

export interface MiniTreeDiffRow {
  id: string;
  type: MiniTreeDiffType;
  left?: MiniTreeFlatNode;
  right?: MiniTreeFlatNode;
  diffs?: MiniTreeDiffDetail[];
}

const valueOrDash = (v?: string | number | null) =>
  v === undefined || v === null || v === "" ? "—" : String(v);

const formatEffectivity = (eff?: EbomTreeNode["effectivity"]) => {
  if (!eff) return "—";
  const parts: string[] = [];
  if (eff.serialRange) parts.push(`序列 ${eff.serialRange[0]}~${eff.serialRange[1]}`);
  if (eff.dateRange) parts.push(`日期 ${eff.dateRange[0]}~${eff.dateRange[1]}`);
  if (eff.blockPoint) parts.push(`Block ${eff.blockPoint}`);
  return parts.length ? parts.join("；") : "—";
};

const formatSubstitutes = (
  list?: EbomTreeNode["substitutes"]
): string => {
  if (!list?.length) return "—";
  return list
    .map((item) =>
      [item.partNumber, item.reason, item.priority !== undefined ? `优先级${item.priority}` : undefined]
        .filter(Boolean)
        .join("·")
    )
    .join("，");
};

export const collectMiniTreeDiffDetails = (
  left?: MiniTreeFlatNode,
  right?: MiniTreeFlatNode
): MiniTreeDiffDetail[] => {
  if (!left || !right) return [];
  const diffs: MiniTreeDiffDetail[] = [];
  if (left.rev !== right.rev) {
    diffs.push({
      key: "rev",
      label: "版本",
      left: valueOrDash(left.rev ? `v${left.rev}` : "—"),
      right: valueOrDash(right.rev ? `v${right.rev}` : "—"),
    });
  }
  if ((left.qty ?? 1) !== (right.qty ?? 1)) {
    diffs.push({
      key: "qty",
      label: "数量",
      left: valueOrDash(left.qty ?? 1),
      right: valueOrDash(right.qty ?? 1),
    });
  }
  if ((left.uom ?? "") !== (right.uom ?? "")) {
    diffs.push({
      key: "uom",
      label: "单位",
      left: valueOrDash(left.uom),
      right: valueOrDash(right.uom),
    });
  }
  if ((left.findNo ?? "") !== (right.findNo ?? "")) {
    diffs.push({
      key: "findNo",
      label: "位置号",
      left: valueOrDash(left.findNo),
      right: valueOrDash(right.findNo),
    });
  }
  if ((left.lifecycle ?? "") !== (right.lifecycle ?? "")) {
    diffs.push({
      key: "lifecycle",
      label: "生命周期",
      left: valueOrDash(left.lifecycle),
      right: valueOrDash(right.lifecycle),
    });
  }
  const effLeft = formatEffectivity(left.effectivity);
  const effRight = formatEffectivity(right.effectivity);
  if (effLeft !== effRight) {
    diffs.push({ key: "effectivity", label: "效期", left: effLeft, right: effRight });
  }
  const subsLeft = formatSubstitutes(left.substitutes);
  const subsRight = formatSubstitutes(right.substitutes);
  if (subsLeft !== subsRight) {
    diffs.push({ key: "substitutes", label: "替代件", left: subsLeft, right: subsRight });
  }
  return diffs;
};

export const flattenEbomTree = (root: EbomTreeNode): MiniTreeFlatNode[] => {
  const out: MiniTreeFlatNode[] = [];
  const walk = (node: EbomTreeNode, depth: number, path: string[]) => {
    out.push({
      id: node.id,
      name: node.name,
      depth,
      path,
      partNumber: node.partNumber,
      rev: node.revision,
      qty: node.qty,
      findNo: node.findNo,
      uom: node.uom,
      lifecycle: node.lifecycle,
      effectivity: node.effectivity,
      substitutes: node.substitutes,
    });
    (node.children ?? []).forEach((child) => walk(child, depth + 1, [...path, child.name]));
  };
  walk(root, 0, [root.name]);
  return out;
};

export const diffEbomTrees = (
  leftRoot: EbomTreeNode,
  rightRoot: EbomTreeNode
): MiniTreeDiffRow[] => {
  const leftNodes = flattenEbomTree(leftRoot);
  const rightNodes = flattenEbomTree(rightRoot);
  const mapLeft = new Map(leftNodes.map((n) => [n.id, n]));
  const mapRight = new Map(rightNodes.map((n) => [n.id, n]));
  const ids = new Set<string>([...mapLeft.keys(), ...mapRight.keys()]);

  const rows: MiniTreeDiffRow[] = [];

  ids.forEach((id) => {
    const left = mapLeft.get(id);
    const right = mapRight.get(id);
    if (left && right) {
      const diffs = collectMiniTreeDiffDetails(left, right);
      rows.push({
        id,
        type: diffs.length ? "modified" : "same",
        left,
        right,
        diffs,
      });
    } else if (left && !right) {
      rows.push({ id, type: "removed", left });
    } else if (!left && right) {
      rows.push({ id, type: "added", right });
    }
  });

  rows.sort(
    (a, b) => (a.left?.depth ?? a.right?.depth ?? 0) - (b.left?.depth ?? b.right?.depth ?? 0)
  );

  return rows;
};
