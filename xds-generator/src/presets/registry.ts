/**
 * 프리셋 레지스트리 — Style Preset Catalog §3.
 *
 * Sprint 1A는 Default만 정의·구현, Sprint 1B는 좌측 패널에
 * 9개 프리셋 라벨을 노출하되 Default 외에는 "v0.2+ 예정"으로 비활성화.
 */

import type { ProjectType } from "../store/types";
import { defaultPreset } from "./default";

export interface PresetMeta {
  id: string;
  label: string;
  emoji?: string;
  description: string;
  recommendedFor: ProjectType[];
  status: "ready" | "planned";
}

export const PRESET_REGISTRY: PresetMeta[] = [
  {
    id: "default",
    label: "기본",
    emoji: "◉",
    description: "회사 표준, Ant Design 풍 균형감",
    recommendedFor: ["admin", "lms", "ai", "b2c"],
    status: "ready",
  },
  {
    id: "dark",
    label: "다크",
    emoji: "◑",
    description: "어두운 배경, 야간·집중 모드",
    recommendedFor: ["admin", "ai"],
    status: "planned",
  },
  {
    id: "rounded",
    label: "둥근·친근",
    emoji: "◯",
    description: "둥근 모서리·친근한 색감 (Material M3 풍)",
    recommendedFor: ["lms", "b2c"],
    status: "planned",
  },
  {
    id: "minimal",
    label: "미니멀",
    emoji: "▢",
    description: "낮은 채도·차분한 모던 (shadcn 풍)",
    recommendedFor: ["ai", "admin"],
    status: "planned",
  },
  {
    id: "trendy",
    label: "트렌디",
    emoji: "✦",
    description: "그라데이션·동적 모션·풍부한 컬러",
    recommendedFor: ["ai", "b2c"],
    status: "planned",
  },
  {
    id: "glass",
    label: "유리·블러",
    emoji: "❖",
    description: "반투명 블러 (액센트 전용)",
    recommendedFor: ["ai"],
    status: "planned",
  },
  {
    id: "sharp",
    label: "각진·정밀",
    emoji: "▮",
    description: "각진 모서리·고밀도·모노 폰트 (Geist 풍)",
    recommendedFor: ["admin", "ai"],
    status: "planned",
  },
  {
    id: "ai-generate",
    label: "AI Generate",
    emoji: "✨",
    description: "자연어로 톤 묘사 → Seed 자동 생성 (v0.4)",
    recommendedFor: [],
    status: "planned",
  },
];

export function getPreset(id: string) {
  if (id === defaultPreset.id) return defaultPreset;
  return defaultPreset; // v0.1: 다른 프리셋은 default로 폴백
}
