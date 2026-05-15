/**
 * WCAG 2.2 AA + KWCAG 2.2 64항목 데이터 파일.
 *
 * 출처: 11_Accessibility_Spec.md §3 (점검 항목 매트릭스) + §10.2 (처리 방식).
 *
 * 본 파일은 KWCAG 정책 갱신 시 *코드 변경 없이* 갱신 가능하도록
 * 데이터로 분리되어 있다 (Accessibility Spec §8.1).
 *
 * 항목 분류:
 * - P-01..P-18 (18) 인지 가능성 (Perceivable)
 * - O-01..O-16 (16) 운용 가능성 (Operable)
 * - U-01..U-14 (14) 이해 가능성 (Understandable)
 * - R-01..R-08 (8)  견고성 (Robust)
 * - K-01..K-08 (8)  KWCAG 한국 특화
 * 합계: 64
 */

export type Category = "perceivable" | "operable" | "understandable" | "robust" | "korean";

/** 적용 대상 — A: 도구 UI, B: 도구가 생성한 산출물, AB: 둘 다. */
export type Surface = "A" | "B" | "AB";

/**
 * 검증 방식.
 * - `auto-axe`        axe-core가 직접 점검
 * - `auto-self`       자체 룰 엔진 (한국어·OKLCH 대비비 등)
 * - `auto-css-lint`   CSS·토큰 정적 점검
 * - `auto-html-lint`  HTML 구조 정적 점검
 * - `auto-meta`       컴포넌트 메타데이터 점검 (자동 갱신 가능 여부 등)
 * - `auto-runtime`    실제 렌더 후 측정 (200% 확대·터치 타겟 등)
 * - `manual`          수동 검증만 가능 (스크린리더 실음·자막 정확도 등)
 */
export type VerificationMode =
  | "auto-axe"
  | "auto-self"
  | "auto-css-lint"
  | "auto-html-lint"
  | "auto-meta"
  | "auto-runtime"
  | "manual";

/**
 * 미달 시 처리 정책.
 * - `block`   Export 차단
 * - `warn`    경고만, Export 가능
 * - `manual`  수동 검토 필요 (자동 판정 불가)
 */
export type Processing = "block" | "warn" | "manual";

export interface Criterion {
  /** 카테고리 prefix + 2자리 번호. 예: "P-01", "K-07". */
  id: string;
  category: Category;
  /** 한국어 라벨 (UI 표시용). */
  title: string;
  /** 짧은 설명. 미달 사유에 그대로 사용 가능한 톤. */
  description: string;
  surface: Surface;
  /** 임계값 — UI에 "최소 N:1" 등으로 노출. */
  threshold: string;
  verification: VerificationMode;
  processing: Processing;
  /** 자동 보정 제안 가능 여부. */
  autoCorrect: boolean;
  /** WCAG 2.2 성공 기준 번호. */
  wcagRef?: string;
  /** KWCAG 2.2 검사 항목 번호. */
  kwcagRef?: string;
  /** axe-core 룰 ID — `auto-axe` 항목에 매핑. */
  axeRule?: string;
}

// =============================================================================
// 3.1 인지 가능성 (Perceivable) — 18개
// =============================================================================

const P: readonly Criterion[] = [
  {
    id: "P-01",
    category: "perceivable",
    title: "본문 텍스트 색상 대비비",
    description: "본문 텍스트와 배경의 대비비가 4.5:1 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 4.5:1",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 1.4.3",
    kwcagRef: "KWCAG 5.3",
    axeRule: "color-contrast",
  },
  {
    id: "P-02",
    category: "perceivable",
    title: "대형 텍스트 대비비",
    description: "18pt 이상(또는 14pt+ Bold) 텍스트의 대비비가 3:1 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 3:1",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 1.4.3",
    // axe-core `color-contrast`는 사이즈 인식이 내부에서 처리되어 P-01로만 귀속.
    // 이중 매핑하면 동일 위반이 두 항목에 중복 카운트되어 UI가 혼란스러움.
  },
  {
    id: "P-03",
    category: "perceivable",
    title: "UI 컴포넌트 대비비",
    description: "버튼·입력 경계 등 UI 컴포넌트의 대비비가 3:1 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 3:1",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 1.4.11",
  },
  {
    id: "P-04",
    category: "perceivable",
    title: "그래픽 요소 대비비",
    description: "정보 전달용 아이콘·그래픽 요소의 대비비가 3:1 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 3:1",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 1.4.11",
  },
  {
    id: "P-05",
    category: "perceivable",
    title: "비-텍스트 콘텐츠 대체 텍스트",
    description: "이미지·아이콘에 alt 또는 aria-label이 있어야 한다.",
    surface: "AB",
    threshold: "필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 1.1.1",
    kwcagRef: "KWCAG 1.1",
    axeRule: "image-alt",
  },
  {
    id: "P-06",
    category: "perceivable",
    title: "색에만 의존하지 않는 정보 전달",
    description: "색만으로 의미를 전달하지 않는다. 텍스트·아이콘·패턴을 병행한다.",
    surface: "AB",
    threshold: "자동 검출",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 1.4.1",
    axeRule: "link-in-text-block",
  },
  {
    id: "P-07",
    category: "perceivable",
    title: "200% 확대 시 가독성 유지",
    description: "본문 200% 확대 시에도 콘텐츠·기능 손실이 없어야 한다.",
    surface: "AB",
    threshold: "breakpoint 미작동",
    verification: "auto-runtime",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 1.4.4",
  },
  {
    id: "P-08",
    category: "perceivable",
    title: "한국어 본문 자간",
    description: "한국어 본문 자간이 권장 범위(-0.05em ~ 0em) 안에 있어야 한다.",
    surface: "AB",
    threshold: "-0.05em ~ 0em",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: true,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "P-09",
    category: "perceivable",
    title: "한국어 본문 행간",
    description: "한국어 본문 행간이 1.5 이상이어야 한다(권장 1.6).",
    surface: "AB",
    threshold: "≥ 1.5",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: true,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "P-10",
    category: "perceivable",
    title: "본문 최소 폰트 크기",
    description: "본문 폰트 크기는 13px 이상이어야 한다(12px 이하 금지).",
    surface: "AB",
    threshold: "≥ 13px",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
  },
  {
    id: "P-11",
    category: "perceivable",
    title: "시각·청각 정보 분리",
    description: "스크린리더로도 동등한 정보가 전달되도록 의미 기반 HTML을 사용한다.",
    surface: "AB",
    threshold: "semantic HTML",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 1.3.1",
    axeRule: "heading-order",
  },
  {
    id: "P-12",
    category: "perceivable",
    title: "색맹 사용자 대응",
    description: "적-녹 색맹 시뮬레이션에서 정보 식별이 가능해야 한다.",
    surface: "AB",
    threshold: "시뮬레이션 통과",
    verification: "auto-self",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 1.4.1",
  },
  {
    id: "P-13",
    category: "perceivable",
    title: "고대비 모드 대응",
    description: "prefers-contrast: more 미디어 쿼리에 대응해야 한다.",
    surface: "A",
    threshold: "미디어 쿼리 정의",
    verification: "auto-css-lint",
    processing: "block",
    autoCorrect: false,
  },
  {
    id: "P-14",
    category: "perceivable",
    title: "다크모드 대응",
    description: "prefers-color-scheme: dark 미디어 쿼리에 대응해야 한다.",
    surface: "AB",
    threshold: "미디어 쿼리 정의",
    verification: "auto-css-lint",
    processing: "block",
    autoCorrect: false,
  },
  {
    id: "P-15",
    category: "perceivable",
    title: "자동 갱신 이미지 통제",
    description: "자동 캐러셀·자동 갱신 이미지는 금지하거나 사용자가 통제 가능해야 한다.",
    surface: "AB",
    threshold: "일시정지 지원",
    verification: "auto-meta",
    processing: "warn",
    autoCorrect: false,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "P-16",
    category: "perceivable",
    title: "비디오·오디오 자막·대본",
    description: "비디오·오디오에 자막 또는 대본이 있어야 한다.",
    surface: "B",
    threshold: "자막 메타 필수",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 1.2.2",
  },
  {
    id: "P-17",
    category: "perceivable",
    title: "자동 콘텐츠 일시정지·정지·숨기기",
    description: "5초 이상 자동 진행되는 콘텐츠는 일시정지·정지·숨김이 가능해야 한다.",
    surface: "AB",
    threshold: "통제 수단 제공",
    verification: "auto-meta",
    processing: "warn",
    autoCorrect: false,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "P-18",
    category: "perceivable",
    title: "페이지 제목",
    description: "페이지에 의미 있는 <title> 요소가 있어야 한다.",
    surface: "AB",
    threshold: "<title> 필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.4.2",
    axeRule: "document-title",
  },
];

// =============================================================================
// 3.2 운용 가능성 (Operable) — 16개
// =============================================================================

const O: readonly Criterion[] = [
  {
    id: "O-01",
    category: "operable",
    title: "키보드만으로 모든 기능 작동",
    description: "모든 인터랙티브 요소가 키보드만으로 작동해야 한다.",
    surface: "AB",
    threshold: "100%",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.1.1",
    axeRule: "focus-order-semantics",
  },
  {
    id: "O-02",
    category: "operable",
    title: "키보드 트랩 없음",
    description: "Tab으로 진입한 영역에서 Tab만으로 빠져나갈 수 있어야 한다.",
    surface: "AB",
    threshold: "자동 검증",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.1.2",
  },
  {
    id: "O-03",
    category: "operable",
    title: "포커스 가시 (외곽선)",
    description: "포커스 링이 2px 이상이고 배경 대비비 3:1 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 2px, 대비비 ≥ 3:1",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 2.4.11",
  },
  {
    id: "O-04",
    category: "operable",
    title: "포커스 순서가 시각 순서와 일치",
    description: "tabindex 순서가 화면상의 시각 순서와 일치해야 한다.",
    surface: "AB",
    threshold: "일치",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.4.3",
    axeRule: "tabindex",
  },
  {
    id: "O-05",
    category: "operable",
    title: "링크 텍스트만으로 목적 명확",
    description: "\"여기를 클릭\" 같은 모호한 링크 텍스트를 금지한다.",
    surface: "AB",
    threshold: "독립 의미",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.4.4",
    axeRule: "link-name",
  },
  {
    id: "O-06",
    category: "operable",
    title: "깜박임 제어 (3Hz 이하)",
    description: "3Hz를 초과하는 깜박임을 금지한다.",
    surface: "AB",
    threshold: "≤ 3Hz",
    verification: "auto-css-lint",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.3.1",
    kwcagRef: "KWCAG 2.3",
  },
  {
    id: "O-07",
    category: "operable",
    title: "자동 이동 시간 제어",
    description: "5초 이상 자동 진행 콘텐츠는 일시정지 가능해야 한다.",
    surface: "AB",
    threshold: "통제 수단 제공",
    verification: "auto-meta",
    processing: "warn",
    autoCorrect: false,
    kwcagRef: "KWCAG 2.2",
  },
  {
    id: "O-08",
    category: "operable",
    title: "타임아웃 경고",
    description: "세션 만료 등 시간 제약을 사용자가 인지·조정할 수 있어야 한다.",
    surface: "AB",
    threshold: "사전 경고",
    verification: "auto-meta",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 2.2.1",
  },
  {
    id: "O-09",
    category: "operable",
    title: "터치 타겟 최소 크기",
    description: "데스크탑 24×24px, 모바일 44×44px 이상이어야 한다.",
    surface: "AB",
    threshold: "≥ 24×24px (모바일 44×44px)",
    verification: "auto-self",
    processing: "block",
    autoCorrect: true,
    wcagRef: "WCAG 2.5.8",
  },
  {
    id: "O-10",
    category: "operable",
    title: "단일 포인터로 작동",
    description: "드래그·복합 제스처에는 단일 포인터 대체 수단을 제공해야 한다.",
    surface: "AB",
    threshold: "대체 수단 제공",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.5.1",
  },
  {
    id: "O-11",
    category: "operable",
    title: "키보드 단축키 충돌 회피",
    description: "단일 문자 단축키는 사용자가 비활성·재정의할 수 있어야 한다.",
    surface: "A",
    threshold: "비활성 가능",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 2.1.4",
  },
  {
    id: "O-12",
    category: "operable",
    title: "prefers-reduced-motion 대응",
    description: "사용자가 모션 감소를 선호하면 애니메이션을 0ms로 줄여야 한다.",
    surface: "AB",
    threshold: "미디어 쿼리 0ms",
    verification: "auto-css-lint",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.3.3",
  },
  {
    id: "O-13",
    category: "operable",
    title: "Label in Name",
    description: "컨트롤의 accessible name이 시각 라벨을 포함해야 한다.",
    surface: "AB",
    threshold: "포함",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.5.3",
    axeRule: "label-content-name-mismatch",
  },
  {
    id: "O-14",
    category: "operable",
    title: "우발적 활성화 방지",
    description: "Pointer Down이 아닌 Pointer Up 시점에 활성화되어야 한다.",
    surface: "AB",
    threshold: "Pointer Up",
    verification: "auto-self",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.5.2",
  },
  {
    id: "O-15",
    category: "operable",
    title: "입력 모드 변경 시 자동 행동 금지",
    description: "포커스·입력만으로 폼 제출·페이지 이동이 발생해서는 안 된다.",
    surface: "AB",
    threshold: "명시 액션 후 처리",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.2.2",
  },
  {
    id: "O-16",
    category: "operable",
    title: "스크롤 영역 키보드 도달",
    description: "스크롤 영역에 키보드만으로 도달·내부 이동이 가능해야 한다.",
    surface: "AB",
    threshold: "키보드 가능",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 2.1.1",
  },
];

// =============================================================================
// 3.3 이해 가능성 (Understandable) — 14개
// =============================================================================

const U: readonly Criterion[] = [
  {
    id: "U-01",
    category: "understandable",
    title: "페이지 주 언어 명시",
    description: "<html lang=\"ko\"> 등 페이지 주 언어가 명시되어야 한다.",
    surface: "AB",
    threshold: "필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.1.1",
    axeRule: "html-has-lang",
  },
  {
    id: "U-02",
    category: "understandable",
    title: "부분 언어 변경 명시",
    description: "영문 등 부분 언어 변경 구간에 lang 속성이 있어야 한다.",
    surface: "AB",
    threshold: "필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.1.2",
    axeRule: "valid-lang",
  },
  {
    id: "U-03",
    category: "understandable",
    title: "폼 입력 필드 라벨",
    description: "모든 입력 필드에 <label> 또는 aria-label이 있어야 한다.",
    surface: "AB",
    threshold: "필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.3.2",
    axeRule: "label",
  },
  {
    id: "U-04",
    category: "understandable",
    title: "placeholder 단독 라벨 금지",
    description: "placeholder만으로 라벨을 대체할 수 없다.",
    surface: "AB",
    threshold: "자동 검증",
    verification: "auto-self",
    processing: "block",
    autoCorrect: false,
    kwcagRef: "KWCAG 4.1",
  },
  {
    id: "U-05",
    category: "understandable",
    title: "오류 메시지 명확",
    description: "오류 메시지는 입력 필드 직후에 시각·텍스트로 표시되어야 한다.",
    surface: "AB",
    threshold: "aria-describedby",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.3.1",
  },
  {
    id: "U-06",
    category: "understandable",
    title: "오류 수정 제안",
    description: "가능한 경우 오류 수정 방안을 제안한다.",
    surface: "AB",
    threshold: "제안 라벨 존재",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 3.3.3",
  },
  {
    id: "U-07",
    category: "understandable",
    title: "일관된 네비게이션",
    description: "페이지 간 같은 네비게이션이 같은 위치에 있어야 한다.",
    surface: "AB",
    threshold: "UI 패턴",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 3.2.3",
  },
  {
    id: "U-08",
    category: "understandable",
    title: "일관된 식별",
    description: "같은 기능을 가진 컨트롤은 같은 라벨·아이콘으로 식별되어야 한다.",
    surface: "AB",
    threshold: "UI 패턴",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 3.2.4",
  },
  {
    id: "U-09",
    category: "understandable",
    title: "한국어 어법·존대 일관성",
    description: "마이크로카피의 존대·반말 톤이 일관되어야 한다.",
    surface: "AB",
    threshold: "Content Guide 준수",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
  },
  {
    id: "U-10",
    category: "understandable",
    title: "약어·전문 용어 풀이",
    description: "첫 등장 시 약어·전문 용어를 풀어 설명한다.",
    surface: "B",
    threshold: "콘텐츠 차원",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 3.1.4",
  },
  {
    id: "U-11",
    category: "understandable",
    title: "페이지 변경 사용자 통보",
    description: "비동기 변경은 aria-live 등으로 보조 기술에 전달되어야 한다.",
    surface: "AB",
    threshold: "aria-live",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.3",
  },
  {
    id: "U-12",
    category: "understandable",
    title: "폼 자동 제출 금지",
    description: "사용자 명시 액션 없이 폼이 제출되어서는 안 된다.",
    surface: "AB",
    threshold: "명시 액션",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 3.2.2",
  },
  {
    id: "U-13",
    category: "understandable",
    title: "입력 형식 사전 안내",
    description: "전화번호·날짜 등 형식이 필요한 입력은 사전 안내해야 한다.",
    surface: "AB",
    threshold: "UI 패턴",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
  },
  {
    id: "U-14",
    category: "understandable",
    title: "입력값 유효성 피드백",
    description: "정해진 입력값의 유효성을 검증하고 명확한 피드백을 제공한다.",
    surface: "AB",
    threshold: "UI 패턴",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 3.3.1",
  },
];

// =============================================================================
// 3.4 견고성 (Robust) — 8개
// =============================================================================

const R: readonly Criterion[] = [
  {
    id: "R-01",
    category: "robust",
    title: "HTML 마크업 유효",
    description: "semantic HTML, 중첩 오류 없음, 중복 id 없음.",
    surface: "AB",
    threshold: "자동 lint",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.1",
    axeRule: "duplicate-id",
  },
  {
    id: "R-02",
    category: "robust",
    title: "ARIA 속성 유효",
    description: "role·aria-* 속성이 ARIA 사양을 준수해야 한다.",
    surface: "AB",
    threshold: "ARIA 사양 준수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.2",
    axeRule: "aria-valid-attr",
  },
  {
    id: "R-03",
    category: "robust",
    title: "상태 변화가 보조 기술에 전달",
    description: "토글·알림 등 상태 변화가 ARIA state·aria-live로 전달되어야 한다.",
    surface: "AB",
    threshold: "ARIA state",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.2",
    axeRule: "aria-allowed-attr",
  },
  {
    id: "R-04",
    category: "robust",
    title: "커스텀 컴포넌트 표준 패턴 준수",
    description: "콤보박스·탭 등 커스텀 컴포넌트가 WAI-ARIA APG 패턴을 따라야 한다.",
    surface: "AB",
    threshold: "WAI-ARIA APG",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.2",
  },
  {
    id: "R-05",
    category: "robust",
    title: "iframe·embed title",
    description: "iframe·embed 요소에 title 속성이 있어야 한다.",
    surface: "AB",
    threshold: "필수",
    verification: "auto-axe",
    processing: "block",
    autoCorrect: false,
    wcagRef: "WCAG 4.1.2",
    axeRule: "frame-title",
  },
  {
    id: "R-06",
    category: "robust",
    title: "미디어 자막·캡션",
    description: "audio·video 요소에 자막·캡션이 있어야 한다.",
    surface: "B",
    threshold: "콘텐츠 차원",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
    wcagRef: "WCAG 1.2.2",
  },
  {
    id: "R-07",
    category: "robust",
    title: "브라우저 호환",
    description: "Chrome·Edge·Firefox·Safari 최신 2버전에서 동작해야 한다.",
    surface: "AB",
    threshold: "최신 2버전",
    verification: "auto-runtime",
    processing: "block",
    autoCorrect: false,
  },
  {
    id: "R-08",
    category: "robust",
    title: "스크린리더 호환",
    description: "NVDA·VoiceOver의 기본 동작에 대응해야 한다 (라벨·역할 검증).",
    surface: "AB",
    threshold: "라벨·역할 검증",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
  },
];

// =============================================================================
// 3.5 KWCAG 한국 특화 — 8개
// =============================================================================

const K: readonly Criterion[] = [
  {
    id: "K-01",
    category: "korean",
    title: "한국어 본문 자간",
    description: "한국어 본문 자간이 권장 범위(-0.05em ~ 0em) 안에 있어야 한다.",
    surface: "AB",
    threshold: "-0.05em ~ 0em",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: true,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "K-02",
    category: "korean",
    title: "한국어 본문 행간",
    description: "한국어 본문 행간이 1.5 이상이어야 한다 (이상적 1.6).",
    surface: "AB",
    threshold: "≥ 1.5 (권장 1.6)",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: true,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "K-03",
    category: "korean",
    title: "한국어 띄어쓰기·맞춤법",
    description: "마이크로카피의 한국어 띄어쓰기·맞춤법 점검 (정량 검증 어려움).",
    surface: "B",
    threshold: "Content Guide 준수",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
  },
  {
    id: "K-04",
    category: "korean",
    title: "콘텐츠 자동 갱신 통제",
    description: "Toast·캐러셀·라이브 데이터의 일시정지가 가능해야 한다.",
    surface: "AB",
    threshold: "일시정지 가능",
    verification: "auto-meta",
    processing: "warn",
    autoCorrect: false,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "K-05",
    category: "korean",
    title: "한국어 폼 라벨 존대 일관성",
    description: "라벨·버튼·알림의 존대·반말 톤이 일관되어야 한다.",
    surface: "AB",
    threshold: "Content Guide 준수",
    verification: "auto-self",
    processing: "warn",
    autoCorrect: false,
  },
  {
    id: "K-06",
    category: "korean",
    title: "한국어 약어 풀이",
    description: "영문 약어는 첫 등장 시 한국어 풀이를 병기한다.",
    surface: "B",
    threshold: "첫 등장 시",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
  },
  {
    id: "K-07",
    category: "korean",
    title: "한국어 본문 폰트",
    description: "Pretendard·Noto Sans KR 등 한국어 폰트가 폰트 스택에 포함되어야 한다.",
    surface: "AB",
    threshold: "스택 포함",
    verification: "auto-self",
    processing: "block",
    autoCorrect: false,
    kwcagRef: "KWCAG 5.4",
  },
  {
    id: "K-08",
    category: "korean",
    title: "한국어 음성 입력·STT 정확도",
    description: "음성 입력 사용 시 한국어 인식 정확도가 충분해야 한다.",
    surface: "AB",
    threshold: "수동 검증",
    verification: "manual",
    processing: "warn",
    autoCorrect: false,
  },
];

// =============================================================================
// 통합 export
// =============================================================================

export const CRITERIA: readonly Criterion[] = [...P, ...O, ...U, ...R, ...K];

export const CRITERIA_BY_CATEGORY: Readonly<Record<Category, readonly Criterion[]>> = {
  perceivable: P,
  operable: O,
  understandable: U,
  robust: R,
  korean: K,
};

export const CRITERIA_BY_ID: Readonly<Record<string, Criterion>> = Object.freeze(
  Object.fromEntries(CRITERIA.map((c) => [c.id, c])),
);

export const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
  perceivable: "인지 가능성",
  operable: "운용 가능성",
  understandable: "이해 가능성",
  robust: "견고성",
  korean: "한국 특화 (KWCAG)",
};

export const PROCESSING_LABEL: Readonly<Record<Processing, string>> = {
  block: "Export 차단",
  warn: "경고",
  manual: "수동 검토",
};

/** 자동 검증 가능 항목만 (manual 제외). axe + self + lint + meta. */
export function autoVerifiableCriteria(): readonly Criterion[] {
  return CRITERIA.filter((c) => c.verification !== "manual");
}

/** axe-core 룰 ID에 매핑된 항목 — engine.ts에서 axe 결과 정합용. */
export function criteriaByAxeRule(rule: string): readonly Criterion[] {
  return CRITERIA.filter((c) => c.axeRule === rule);
}

/** 카테고리·Surface 필터링 헬퍼. */
export function filterCriteria(opts: {
  surface?: Surface;
  category?: Category;
  processing?: Processing;
}): readonly Criterion[] {
  return CRITERIA.filter((c) => {
    if (opts.surface && c.surface !== opts.surface && c.surface !== "AB") return false;
    if (opts.category && c.category !== opts.category) return false;
    if (opts.processing && c.processing !== opts.processing) return false;
    return true;
  });
}
