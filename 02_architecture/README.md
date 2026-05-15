# 02. 자체 디자인 시스템 — 전체 구조·기획서

> 작성일: 2026-05-12
> 목적: 회사 내부 디자인 시스템·UI 시스템·UX 가이드의 아키텍처와 산출물 트리, 단계별 로드맵을 정의한다.
> 전제: `01_design_systems_research.md`에서 분석한 7가지 차용 패턴을 기반으로 설계.

---

## 1. 이름·범위 정의

본 시스템의 정식 명칭(가칭): **Xinics Design System (XDS)**

3계층으로 구성된다.

```
XDS (Xinics Design System)
├── XDS-Core          ← 회사 범용 베이스 (모든 제품 공통)
├── XDS-Project       ← 프로젝트별 확장 (LMS / AICMS / B2C / AI Studio …)
└── XDS-Guidelines    ← UI 시스템 & UX 가이드 문서군
```

---

## 2. 3계층 아키텍처

### 2-1. XDS-Core (범용 베이스)

회사 모든 제품이 공유하는 **최소 공통 분모**.

| 구성요소 | 산출 형태 | 비고 |
|---|---|---|
| Design Principles | `.md` | 4~6개의 디자인 원칙 (Clarity / Consistency / Efficiency / Accessibility …) |
| Design Tokens | `.json` + `.css` | Seed → Map → Alias 3단계 (Ant Design 모델) |
| Base Components | `.md` + `.html` 명세 | Button / Input / Select / Modal / Table … 30개 내외 |
| Iconography | `.svg` 세트 + 가이드 | Lucide 기반 + 자체 보강 |
| Typography | `.json` 스케일 | Pretendard(한국어) + Inter(영문) 매트릭스 |
| Motion | `.md` + CSS easing 토큰 | duration·easing 표준 |
| Accessibility | `.md` | WCAG 2.2 AA 기준 체크리스트 |

### 2-2. XDS-Project (프로젝트별 확장)

베이스에서 **오버라이드**하는 레이어. 각 프로젝트가 자신만의 스타일·토큰·컴포넌트 변형을 정의.

```
XDS-Project/
├── LMS/             ← 교육 제품 (가독성·접근성·일러스트 강조)
├── AICMS/           ← AI 컨텐츠 매니지먼트 (Geist 톤·모션)
├── Admin/           ← B2B 어드민 (Ant Design 톤, 고밀도)
└── Mobile-B2C/      ← B2C 모바일 (Material M3 톤)
```

각 프로젝트 폴더는 동일 구조:

```
LMS/
├── tokens.json       ← Core 토큰 오버라이드
├── style-guide.md    ← 이 프로젝트만의 시각 톤
├── components/       ← Core 컴포넌트 변형·신규 컴포넌트
└── patterns.md       ← 이 도메인 특화 UX 패턴 (예: 강의 카드, 진도율 위젯)
```

### 2-3. XDS-Guidelines (가이드 문서군)

읽는 사람·시점에 따라 분리.

| 가이드 | 대상 | 내용 |
|---|---|---|
| **UI System Guide** | 디자이너·개발자 | 컴포넌트 사용법, Variant·State, Props 명세, Do/Don't |
| **UX Guide** | PD·디자이너·기획 | 작업 흐름 패턴 (Polaris 스타일) — 폼 작성·리소스 인덱스·온보딩 등 |
| **Content Guide** | 모두 | 마이크로카피·라이팅 톤·한국어 가이드(Toss 스타일) |
| **Accessibility Guide** | 모두 | WCAG 체크리스트, 키보드 흐름, 스크린리더 |
| **Brand Guide** | 디자이너·마케팅 | 로고·컬러·일러스트 톤 (시스템과 분리) |

---

## 3. Design Token 3계층 (Ant Design 모델)

리서치 문서에서 차용한 핵심 패턴 #1.

### Layer 1: Seed Token (원천)

디자이너가 직접 결정하는 **소수의 입력값**.

```json
{
  "seed": {
    "colorPrimary": "#1677FF",
    "colorSuccess": "#52C41A",
    "colorWarning": "#FAAD14",
    "colorError": "#FF4D4F",
    "colorInfo": "#1677FF",
    "borderRadius": 6,
    "fontSize": 14,
    "sizeUnit": 4,
    "wireframe": false
  }
}
```

### Layer 2: Map Token (알고리즘 생성)

Seed에서 **자동 도출**되는 색상 팔레트·치수 스케일.

```json
{
  "map": {
    "colorPrimary-1": "#E6F4FF",
    "colorPrimary-2": "#BAE0FF",
    "colorPrimary-3": "#91CAFF",
    "colorPrimary-4": "#69B1FF",
    "colorPrimary-5": "#4096FF",
    "colorPrimary-6": "#1677FF",
    "colorPrimary-7": "#0958D9",
    "colorPrimary-8": "#003EB3",
    "colorPrimary-9": "#002C8C",
    "colorPrimary-10": "#001D66"
  }
}
```

생성 알고리즘: **HSV 모델에서 채도·명도를 단계적으로 조정**하거나 OKLCH 모델 사용 (Material M3 방식).

### Layer 3: Alias Token (의미 부여)

컴포넌트에서 실제 참조하는 **의미론적 토큰**.

```json
{
  "alias": {
    "colorBgContainer": "{map.colorNeutral-1}",
    "colorTextBase": "{map.colorNeutral-10}",
    "colorBorder": "{map.colorNeutral-5}",
    "colorLink": "{map.colorPrimary-6}",
    "colorLinkHover": "{map.colorPrimary-5}",
    "controlHeight": 32,
    "controlHeightSM": 24,
    "controlHeightLG": 40
  }
}
```

컴포넌트는 Alias만 참조 → 스타일 변경 시 Seed만 바꾸면 전체 연쇄 갱신.

---

## 4. 스타일 프리셋 시스템

첨부 이미지의 좌측 리스트처럼 **하나의 토큰 구조 위에 여러 외관 변형**을 얹는다.

```
스타일 프리셋 = Seed Token 세트 + Surface Style + Component Variant 매핑
```

### 프리셋 목록 (1차)

| 프리셋 ID | 표시명 | 베이스 | 특징 |
|---|---|---|---|
| `default` | Default Style | Ant Design 풍 | 회사 표준 |
| `dark` | Dark Style | Default의 다크 변형 | colorBgBase 반전 |
| `mui` | MUI-like Style | Material M3 풍 | 더 둥글고, Elevation 강조 |
| `shadcn` | shadcn-like Style | Modern Neutral | 낮은 채도, 큰 radius |
| `cartoon` | Cartoon Style | 굵은 stroke, 진한 그림자 | 교육 제품용 |
| `illustration` | Illustration Style | 일러스트 통합 | LMS·온보딩 |
| `skeuomorphism` | Bootstrap Skeuomorphism | 그라데이션·강한 그림자 | 레거시 호환 |
| `glass` | Glass Style | 반투명 블러 | AI 제품 액센트 |
| `geek` | Geek Style | Mono 폰트·다크·고밀도 | 개발자 도구 |
| `ai-generated` | AI Generate Theme | 사용자 텍스트 → 토큰 자동 생성 | 향후 확장 |

### 프리셋 데이터 구조

```json
{
  "preset": {
    "id": "shadcn",
    "name": "shadcn-like Style",
    "extends": "default",
    "seed": {
      "colorPrimary": "#0F172A",
      "borderRadius": 8,
      "fontFamily": "Inter, Pretendard, sans-serif"
    },
    "surface": {
      "elevation": "flat",
      "borderStyle": "1px solid",
      "shadow": "minimal"
    },
    "components": {
      "Button": { "weight": "medium", "ringOnFocus": true },
      "Card": { "border": true, "shadow": "none" }
    }
  }
}
```

---

## 5. 산출물 트리 (최종 폴더 구조)

```
디자인 시스템/
├── 01_design_systems_research.md     ✅ 완료
├── 02_architecture.md                ✅ 완료 (본 문서)
├── 03_style_presets.md               ▶ 다음 단계
│
├── core/
│   ├── principles.md
│   ├── tokens/
│   │   ├── seed.json
│   │   ├── map.json
│   │   ├── alias.json
│   │   └── tokens.css                ← CSS Variables 빌드 결과
│   ├── components/
│   │   ├── Button.md
│   │   ├── Input.md
│   │   └── …
│   ├── typography.md
│   ├── motion.md
│   └── accessibility.md
│
├── projects/
│   ├── LMS/
│   ├── AICMS/
│   ├── Admin/
│   └── Mobile-B2C/
│
├── guidelines/
│   ├── ui-system-guide.md
│   ├── ux-guide.md
│   ├── content-guide.md
│   ├── accessibility-guide.md
│   └── brand-guide.md
│
├── presets/
│   ├── default.json
│   ├── dark.json
│   ├── shadcn.json
│   └── …
│
└── tools/
    └── preview.html                  ← 인터랙티브 스타일 프리뷰 + MD 추출 도구
```

---

## 6. 단계별 로드맵

### Phase 1 — 기획·리서치 (현재)
- [x] 리서치 문서
- [x] 아키텍처 문서 (본 문서)
- [ ] 스타일 프리셋 정의서 (다음 작업)

### Phase 2 — Core 구축
- [ ] Design Principles 작성
- [ ] Seed/Map/Alias 토큰 JSON 정의 (`default` 기준)
- [ ] Core 컴포넌트 명세 — Button/Input/Select/Modal부터 5개씩 단계적
- [ ] Typography·Motion·Accessibility 가이드

### Phase 3 — 인터랙티브 프리뷰 도구
- [ ] 단일 HTML 파일로 스타일 전환 + 컴포넌트 프리뷰
- [ ] 토큰 실시간 편집 (Primary Color·Border Radius·Compact 등)
- [ ] 선택한 스타일의 MD 파일 + tokens.json 다운로드 기능
- [ ] 첨부 이미지 두 장의 UX를 결합 (좌측 스타일 리스트 + 우측 토큰 슬라이더)

### Phase 4 — 프로젝트별 확장
- [ ] LMS 프로젝트 토큰·패턴
- [ ] AICMS 프로젝트 토큰·패턴
- [ ] Admin 프로젝트 토큰·패턴

### Phase 5 — 가이드 문서군
- [ ] UI System Guide
- [ ] UX Guide (작업 흐름 패턴 — Polaris 방식)
- [ ] Content Guide (한국어 라이팅)
- [ ] Accessibility Guide

### Phase 6 — 운영·도구화
- [ ] Figma Variables 연동 (보유한 Figma MCP 활용 가능)
- [ ] Storybook·코드 스니펫 자동 생성
- [ ] 토큰 변경 시 영향도 분석 (Lint)

---

## 7. 거버넌스 모델

| 역할 | 책임 |
|---|---|
| **PD** | 디자인 원칙·UX 가이드·패턴 정의 (PCD/USD 산출물과 연계) |
| **디자이너** | 토큰 값 결정, 컴포넌트 시각 디자인, 스타일 프리셋 |
| **개발자(Creator)** | 토큰을 코드 토큰으로 매핑, 컴포넌트 구현, Storybook |
| **PD Review Gate** | FRD·컴포넌트 명세는 PD 검토 통과 후 머지 |

기존에 보유한 `pcd` / `usd` / `frd` 스킬과 결합:
- **PCD**: 새 디자인 토큰·컴포넌트 도입 사유 (문제 맥락)
- **USD**: 디자인이 적용되는 사용자 시나리오
- **FRD**: 컴포넌트의 기능 요구사항 (Props, State, A11y)

---

## 8. 성공 지표 (시스템 운영 KPI)

| 지표 | 목표 |
|---|---|
| Core 컴포넌트 커버리지 | 6개월 내 80% (제품 화면에서 Core 컴포넌트가 차지하는 비율) |
| 토큰 일관성 | 하드코딩 컬러·치수 < 5% |
| 접근성 | 신규 컴포넌트 100% WCAG AA |
| 문서화 완성도 | 컴포넌트별 Do/Don't·코드 예시·A11y 명세 모두 작성 |

---

## 9. 다음 단계

본 문서를 검토한 후, **`03_style_presets.md`** (스타일 프리셋 9종의 상세 정의서)를 작성한다.
스타일 프리셋 정의가 끝나면 `tools/preview.html` 제작으로 넘어가 첨부 이미지처럼 **스타일 선택 → 실시간 프리뷰 → MD 추출**이 가능한 도구를 만든다.