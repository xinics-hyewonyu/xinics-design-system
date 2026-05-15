/**
 * UI Spec §3.3 + FRD R1 — 신규 프로젝트 생성 모달.
 *
 * 4개 프로젝트 타입 카드 선택 + 이름·설명 입력 + 작업자 (v0.1에서 수동 입력).
 */

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { useProjectStore } from "../store/projectStore";
import type { ProjectType } from "../store/types";

const TYPE_CARDS: { value: ProjectType; label: string; description: string }[] = [
  { value: "admin", label: "B2B 어드민", description: "데이터·기능 밀도 높은 운영 화면" },
  { value: "lms", label: "교육·LMS", description: "학습자 친화·가독성·접근성 우선" },
  { value: "ai", label: "AI 제품", description: "AI 생성 결과 카드·채팅·워크플로우" },
  { value: "b2c", label: "B2C 웹·모바일", description: "마케팅·랜딩·일반 사용자 화면" },
];

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewProjectDialog({ onClose, onCreated }: Props) {
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("admin");
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const canSubmit = name.trim().length >= 1 && name.trim().length <= 100 && createdBy.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const project = createProject({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      createdBy: createdBy.trim(),
    });
    onCreated(project.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="신규 프로젝트"
      className="fixed inset-0 z-20 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[560px] max-w-[92vw] rounded-lg p-6"
        style={{
          background: "var(--xds-tool-surface)",
          border: "1px solid var(--xds-tool-border)",
          boxShadow: "var(--xds-tool-shadow-md)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">신규 프로젝트</h2>
            <p className="text-xs mt-1" style={{ color: "var(--xds-tool-text-muted)" }}>
              프로젝트 타입을 선택하면 그에 맞는 추천 프리셋이 ★ 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1 rounded hover:bg-tool-elevated"
          >
            <X className="size-4" />
          </button>
        </div>

        <Field label="프로젝트 타입">
          <div className="grid grid-cols-2 gap-2">
            {TYPE_CARDS.map((card) => {
              const selected = card.value === type;
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => setType(card.value)}
                  className="text-left p-3 rounded-md transition-colors"
                  style={{
                    background: selected ? "var(--xds-tool-elevated)" : "var(--xds-tool-surface)",
                    border: `1px solid ${selected ? "var(--xds-tool-primary)" : "var(--xds-tool-border)"}`,
                  }}
                  aria-pressed={selected}
                >
                  <div className="font-medium text-sm">{card.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--xds-tool-text-muted)" }}>
                    {card.description}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="mt-4 space-y-3">
          <Field label="프로젝트 이름" hint="1~100자, 한글·영문 혼용 가능">
            <TextInput value={name} onChange={setName} placeholder="예: AICMS Admin" ariaLabel="프로젝트 이름" />
          </Field>
          <Field label="설명 (선택)">
            <TextInput value={description} onChange={setDescription} placeholder="간단히 한 줄로" />
          </Field>
          <Field label="작업자" hint="v0.3에서 SSO 자동 채움 예정">
            <TextInput value={createdBy} onChange={setCreatedBy} placeholder="유혜원" ariaLabel="작업자 이름" />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            만들기
          </Button>
        </div>
      </div>
    </div>
  );
}
