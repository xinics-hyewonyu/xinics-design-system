/**
 * UI Spec §4.3 — 중앙 프리뷰 패널.
 *
 * Sprint 1B 범위: L1 핵심 5종 (Button · Input · Card · Modal · Form)을
 * 현재 TokenTree로 즉시 렌더링. 토큰은 inline <style scoped>로 주입.
 *
 * 갱신 성능 (FRD §6, 16ms 이하)을 위해 무거운 컴포넌트 메모이즈.
 */

import { forwardRef, memo, useMemo } from "react";
import type { TokenTree } from "../tokens/types";
import { tokenTreeToCss } from "../output/cssVariables";

interface Props {
  tree: TokenTree;
}

/**
 * forwardRef로 노출되는 ref는 `.xds-preview-scope` 컨테이너를 가리킨다.
 * A11yPanel이 이 노드를 axe-core scan 루트로 사용한다.
 */
export const Preview = memo(forwardRef<HTMLDivElement, Props>(function Preview(
  { tree },
  ref,
) {
  const cssText = useMemo(() => tokenTreeToCss(tree), [tree]);
  // <style>의 :root 변수를 .xds-preview 스코프로 한정해 도구 UI에 누출되지 않게 함.
  const scoped = useMemo(
    () =>
      cssText
        .replace(/:root/g, ".xds-preview-scope")
        .replace(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\}\n\}/g, "$&"),
    [cssText],
  );

  return (
    <section
      className="h-full overflow-y-auto"
      style={{ background: "var(--xds-tool-bg)" }}
      aria-label="컴포넌트 프리뷰"
    >
      <style>{scoped}</style>
      <div className="px-8 py-6">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--xds-tool-text-muted)" }}>
            L1 핵심 컴포넌트
          </h2>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{
              background: "var(--xds-tool-elevated)",
              color: "var(--xds-tool-text-muted)",
              border: "1px solid var(--xds-tool-border)",
            }}
          >
            5 / 5
          </span>
        </div>

        <div ref={ref} className="xds-preview-scope flex flex-col gap-6">
          <PreviewSection title="Button">
            <PreviewButton variant="primary">Primary</PreviewButton>
            <PreviewButton variant="default">Default</PreviewButton>
            <PreviewButton variant="dashed">Dashed</PreviewButton>
            <PreviewButton variant="danger">Danger</PreviewButton>
            <PreviewButton variant="primary" disabled>
              Disabled
            </PreviewButton>
          </PreviewSection>

          <PreviewSection title="Input">
            <PreviewInput placeholder="기본 입력" />
            <PreviewInput placeholder="포커스 시 링 표시" />
            <PreviewInput placeholder="비활성" disabled />
          </PreviewSection>

          <PreviewSection title="Card">
            <PreviewCard
              title="강의 시청 완료"
              body="총 8개 강의 중 6개를 완료했어요. 진도율 75%."
            />
            <PreviewCard
              title="이번 주 학습 통계"
              body="평균 학습 시간이 지난주 대비 12% 늘었습니다."
            />
          </PreviewSection>

          <PreviewSection title="Form">
            <PreviewForm />
          </PreviewSection>

          <PreviewSection title="Modal (정적 미리보기)">
            <PreviewModal />
          </PreviewSection>
        </div>
      </div>
    </section>
  );
}));

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--xds-tool-text-muted)" }}
      >
        {title}
      </h3>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

type PreviewButtonVariant = "primary" | "default" | "dashed" | "danger";

function PreviewButton({
  variant,
  disabled,
  children,
}: {
  variant: PreviewButtonVariant;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const base: React.CSSProperties = {
    height: "var(--xds-control-height-md)",
    paddingLeft: "var(--xds-control-padding-x)",
    paddingRight: "var(--xds-control-padding-x)",
    borderRadius: "var(--xds-seed-border-radius)",
    fontFamily: "var(--xds-seed-font-family)",
    fontSize: "var(--xds-font-size-sm)",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 120ms ease",
  };
  const styles: Record<PreviewButtonVariant, React.CSSProperties> = {
    primary: {
      ...base,
      background: "var(--xds-action-primary)",
      color: "var(--xds-text-on-primary)",
      border: "none",
    },
    default: {
      ...base,
      background: "var(--xds-surface-elevated)",
      color: "var(--xds-text-body)",
      border: "1px solid var(--xds-border-default)",
    },
    dashed: {
      ...base,
      background: "var(--xds-surface-elevated)",
      color: "var(--xds-text-body)",
      border: "1px dashed var(--xds-border-default)",
    },
    danger: {
      ...base,
      background: "var(--xds-action-danger)",
      color: "var(--xds-text-on-danger)",
      border: "none",
    },
  };
  return (
    <button type="button" disabled={disabled} style={styles[variant]}>
      {children}
    </button>
  );
}

function PreviewInput({ placeholder, disabled }: { placeholder?: string; disabled?: boolean }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      disabled={disabled}
      style={{
        height: "var(--xds-control-height-md)",
        paddingLeft: "var(--xds-control-padding-x)",
        paddingRight: "var(--xds-control-padding-x)",
        borderRadius: "var(--xds-seed-border-radius)",
        fontFamily: "var(--xds-seed-font-family)",
        fontSize: "var(--xds-font-size-sm)",
        background: "var(--xds-surface-elevated)",
        color: "var(--xds-text-body)",
        border: "1px solid var(--xds-border-default)",
        minWidth: 220,
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

function PreviewCard({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        background: "var(--xds-surface-elevated)",
        border: "1px solid var(--xds-border-subtle)",
        borderRadius: "var(--xds-radius-lg)",
        padding: "var(--xds-size-md)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        fontFamily: "var(--xds-seed-font-family)",
        minWidth: 260,
        maxWidth: 320,
      }}
    >
      <h4
        style={{
          color: "var(--xds-text-heading)",
          fontSize: "var(--xds-font-size-md)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {title}
      </h4>
      <p
        style={{
          color: "var(--xds-text-caption)",
          fontSize: "var(--xds-font-size-sm)",
          lineHeight: "var(--xds-line-height-korean)",
          letterSpacing: "var(--xds-letter-spacing-korean)",
        }}
      >
        {body}
      </p>
    </article>
  );
}

function PreviewForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        background: "var(--xds-surface-elevated)",
        border: "1px solid var(--xds-border-subtle)",
        borderRadius: "var(--xds-radius-lg)",
        padding: "var(--xds-size-lg)",
        fontFamily: "var(--xds-seed-font-family)",
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <h4
        style={{
          color: "var(--xds-text-heading)",
          fontSize: "var(--xds-font-size-md)",
          fontWeight: 600,
        }}
      >
        프로필 수정
      </h4>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "var(--xds-text-body)", fontSize: "var(--xds-font-size-sm)" }}>
          이름
        </span>
        <PreviewInput placeholder="유혜원" />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "var(--xds-text-body)", fontSize: "var(--xds-font-size-sm)" }}>
          이메일
        </span>
        <PreviewInput placeholder="hwyu51@xinics.com" />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <PreviewButton variant="primary">저장</PreviewButton>
        <PreviewButton variant="default">취소</PreviewButton>
      </div>
    </form>
  );
}

function PreviewModal() {
  return (
    <div
      style={{
        background: "var(--xds-surface-elevated)",
        border: "1px solid var(--xds-border-subtle)",
        borderRadius: "var(--xds-radius-lg)",
        padding: "var(--xds-size-lg)",
        fontFamily: "var(--xds-seed-font-family)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        width: 380,
      }}
      role="dialog"
      aria-label="모달 미리보기"
    >
      <h4
        style={{
          color: "var(--xds-text-heading)",
          fontSize: "var(--xds-font-size-md)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        변경 사항을 저장할까요?
      </h4>
      <p
        style={{
          color: "var(--xds-text-caption)",
          fontSize: "var(--xds-font-size-sm)",
          lineHeight: "var(--xds-line-height-korean)",
          marginBottom: 16,
        }}
      >
        토큰 변경 사항이 자동 저장됩니다. 직접 저장하지 않아도 됩니다.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <PreviewButton variant="default">취소</PreviewButton>
        <PreviewButton variant="primary">확인</PreviewButton>
      </div>
    </div>
  );
}
