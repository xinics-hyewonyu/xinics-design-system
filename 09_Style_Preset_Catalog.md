# Style Preset Catalog — XDS-001 스타일 프리셋 카탈로그

- 작성일: 2026-05-12
- 작성자: 유혜원
- 상태: Draft v0.1
- 이슈키: XDS-001
- 참조: PRD §3.D, Token Schema §2, Output Spec §3

> **TL;DR** 도구가 제공하는 프리셋 7종 + AI Generate 1종. 모두 시각 톤으로만 이름이 매겨지되, 각 프리셋의 *내부 설계*는 실제 사용 컨텍스트(밀도·터치·도메인 컴포넌트·UX 패턴)를 함께 고려한다. 에디터 좌측 패널은 프로젝트 타입에 따라 추천 프리셋을 ★ 표시로 강조한다.

## 이 문서가 묻는 결정

- [x] **프리셋 구조**: 단일 flat 리스트 7종 + AI Generate — 결정
- [x] **이름 규칙**: 시각 톤으로만 명명 (역할명·사용자명 사용 금지 — 모든 회사 제품이 학습자·교수자·운영자를 다 다루므로 역할명은 변별력 없음)
- [x] **내부 설계**: 각 프리셋의 *내부*는 시각 톤 + 밀도 + 터치 타겟 + 추천 도메인 컴포넌트 + 추천 UX 패턴을 한 묶음으로 큐레이션 (이름은 시각, 내용은 컨텍스트)
- [x] **회사 제품과 무관한 프리셋 제외**: 자이닉스 제품 라인(LMS·AICMS·B2B 어드민·AI·B2C)에서 거의 사용되지 않을 톤은 카탈로그에서 제외 — 일러스트 통합·카툰·레거시 호환 프리셋 제외 결정
- [x] **상속 관계**: 모든 프리셋은 Default를 extend (1단계 상속) — 결정
- [x] **프로젝트 타입별 자동 추천**: 에디터 진입 시 프로젝트 타입에 맞는 추천 프리셋을 ★ 표시로 강조 — 결정
- [x] **AI Generate 시점**: v0.4 — 결정
- [x] **사용자 커스텀 프리셋 저장 가능 여부**: v0.3에서 "내 프리셋"으로 저장 가능 — 결정

---

## 1. 프리셋의 정의·설계 원칙

### 1.1 프리셋의 정의
```
프리셋 = (Seed Token 세트) + (Surface 스타일) + (Component Variant 매핑) + (메타데이터)
       + (선택) (큐레이트된 도메인 컴포넌트 L4 + 추천 UX 패턴 + 밀도·터치 타겟 조정)
```

- **Seed Token 세트**: Token Schema §2.1의 13개 Seed 토큰 값
- **Surface 스타일**: 컴포넌트 표면 처리 (그림자·경계·블러·그라데이션·noise)
- **Component Variant 매핑**: Button·Card·Input 등 핵심 컴포넌트의 시각 변형 결정
- **메타데이터**: 추천 사용처, 회피 사용처, 상속 관계

### 1.2 설계 원칙
프리셋은 **시각 톤만** 정의하지 않는다. 각 프리셋은 *누가·언제·어디서 쓰는가*를 고려해서 다음 5가지를 한 묶음으로 결정한다.

1. **시각 톤** (색·모서리·그림자·폰트)
2. **데이터 밀도** (compact / default / comfortable)
3. **터치 타겟 크기** (모바일 사용 가능성에 따라)
4. **추천 도메인 컴포넌트 L4** (해당 사용처에 자주 등장하는 컴포넌트)
5. **추천 UX 패턴** (해당 사용처에 적합한 흐름)

예: `학습자 친화` 프리셋 = 둥근 모서리 + comfortable 밀도 + 큰 터치 타겟(48px) + L4(LessonItem·ProgressBar·QuizCard) + 추천 패턴(온보딩·Empty State).

### 1.3 상속 관계
모든 프리셋은 `default`를 extend (1단계 상속). 다단계 상속 금지.

### 1.4 프로젝트 타입별 자동 추천
에디터 진입 시 프로젝트 타입(`admin`/`lms`/`ai`/`b2c`)에 따라 좌측 패널에서 추천 프리셋을 ★ 표시로 강조한다 (선택은 자유). 매핑은 §5 참조.

---

## 2. 프리셋 JSON 스키마

**상속 규칙**: 자식 프리셋은 *override할 필드만 명시*한다. 명시되지 않은 토큰·surface·components는 부모(`extends` 대상)에서 그대로 상속된다. Default 프리셋은 부모가 없으므로 Token Schema §2.1의 Seed 토큰 13종 + Map 알고리즘 + Alias 매핑을 모두 명시해야 한다.

**accessibility 블록**: 모든 프리셋이 §2 스키마의 `accessibility` 블록을 명시하지 않으면 Default의 값을 상속하는 것으로 간주된다.


```json
{
  "$schema": "https://xds.xinics.com/schemas/preset-v1.json",
  "id": "shadcn",
  "name": "shadcn-like Style",
  "version": "1.0.0",
  "extends": "default",
  "inspiration": "shadcn/ui + Radix + Vercel Geist",
  "useCases": {
    "recommended": ["ai", "admin"],
    "avoid": ["lms-kids"]
  },

  "seed": {
    "color.primary": "oklch(0.20 0.05 250)",
    "color.bgBase": "oklch(1.00 0 0)",
    "color.textBase": "oklch(0.15 0.02 250)",
    "borderRadius": 8,
    "fontSize": 14,
    "fontFamily": ["Inter", "Pretendard", "system-ui"]
  },

  "surface": {
    "elevation": "flat",
    "borderStyle": "1px solid",
    "shadowStyle": "minimal",
    "backdropFilter": null,
    "gradient": null
  },

  "components": {
    "Button": {
      "variants": {
        "primary":   { "weight": "medium", "ringOnFocus": true },
        "outline":   { "weight": "medium", "borderColor": "alias.border.default" },
        "ghost":     { "weight": "medium", "bg": "transparent", "hoverBg": "alias.surface.muted" }
      }
    },
    "Card": {
      "border": "1px solid alias.border.subtle",
      "shadow": "none",
      "borderRadius": "{map.radius.lg}"
    },
    "Input": {
      "border": "1px solid alias.border.default",
      "ringOnFocus": "2px solid alias.focus.ring.color"
    }
  },

  "accessibility": {
    "minContrast": 4.5,
    "focusRingMinWidth": 2,
    "touchTargetMinSize": 44
  }
}
```

---

## 3. 프리셋 7종 상세

모든 프리셋이 같은 레벨(flat list). 시각 톤으로만 명명. 각 프리셋의 *내부 설계*는 사용 컨텍스트를 함께 고려한다(밀도·터치 타겟·도메인 컴포넌트·UX 패턴).

| # | 한글 라벨 | 영문 ID | 한 줄 설명 | 내부 설계 시 고려한 컨텍스트 |
|---|---|---|---|---|
| 1 | 기본 | `default` | 회사 표준, 균형감 있는 톤 | 모든 프로젝트의 출발점, 균형 밀도 |
| 2 | 다크 | `dark` | 어두운 배경, 야간·집중 모드 | 모든 프로젝트의 다크 변형 |
| 3 | 둥근·친근 | `rounded` | 둥근 모서리·친근한 색감 (Material M3 풍) | 가독성·친근감 우선, 모바일 큰 터치 타겟, 학습 화면·B2C 모바일 |
| 4 | 미니멀 | `minimal` | 낮은 채도·차분한 모던 (shadcn 풍) | 콘텐츠 작성·정보 중심, 중밀도, AI 제품·SaaS |
| 5 | 트렌디 | `trendy` | 그라데이션·동적 모션·풍부한 컬러 (Linear/Vercel 풍) | AI 제품 마케팅·랜딩·온보딩, 모션 강조 |
| 6 | 유리·블러 | `glass` | 반투명 블러 (Apple/Windows 11 풍) | 액센트 전용, 히어로·랜딩, 다른 프리셋 위 |
| 7 | 각진·정밀 | `sharp` | 각진 모서리·고밀도·모노 폰트 (Geist 풍) | 데이터 테이블·로그·모니터링 헤비 화면, compact 밀도 |

**제외된 프리셋**:
- 일러스트 통합 — 자이닉스 LMS·AI 제품에서 일러스트 자산을 광범위하게 사용할 가능성이 낮음. 필요 시 다른 프리셋에 일러스트 자산을 *옵션*으로 추가 가능.
- 카툰 — 자이닉스 LMS가 초·중등 대상 콘텐츠를 주력으로 다루지 않음.
- 레거시 호환(스큐어모피즘) — 결제·금융 마이그레이션 케이스 부재.

각 프리셋의 상세 정의는 다음과 같다.

### 3.1 기본 (Default) — 회사 표준

**ID**: `default` | **Extends**: 없음 (베이스) | **출처**: Ant Design 5.0 + 자체 보강

```yaml
seed:
  color.primary:    oklch(0.55 0.18 250)   # #1677FF 근사
  color.success:    oklch(0.65 0.17 145)   # #52C41A 근사
  color.warning:    oklch(0.78 0.15 75)    # #FAAD14 근사
  color.error:      oklch(0.55 0.22 25)    # #FF4D4F 근사
  color.bgBase:     oklch(1 0 0)
  color.textBase:   oklch(0.15 0 0)
  borderRadius:     6
  fontSize:         14
  fontFamily:       [Pretendard, system-ui]
  spacingBase:      4
  density:          default

surface:
  elevation:        minimal
  borderStyle:      1px solid
  shadowStyle:      "0 1px 2px rgba(0,0,0,0.03)"

components:
  Button:
    primary:        { bg: alias.action.primary, text: alias.text.onPrimary, border: none, radius: 6 }
    danger:         { bg: alias.action.danger,  text: alias.text.onDanger,  border: none, radius: 6 }
    default:        { bg: alias.surface.elevated, text: alias.text.body, border: 1px solid alias.border.default, radius: 6 }
    dashed:         { bg: alias.surface.elevated, text: alias.text.body, border: 1px dashed alias.border.default, radius: 6 }
  Card:
    border:         1px solid alias.border.subtle
    shadow:         "0 1px 2px rgba(0,0,0,0.03)"
  Input:
    border:         1px solid alias.border.default
    ringOnFocus:    2px solid alias.focus.ring.color
```

- **추천 사용처**: 회사 모든 신규 프로젝트의 기본값. 어드민·내부 운영툴.
- **회피**: 어린이·일러스트 톤이 필요한 LMS 학습 화면 → `cartoon`·`illustration` 사용.

### 3.2 다크 (Dark) — 어두운 환경

**ID**: `dark` | **Extends**: `default` | **출처**: Ant Design Dark + GitHub Dark

핵심 변경 (Default에서):
```yaml
seed:
  color.primary:    oklch(0.60 0.17 250)   # 다크에서 채도 약간 감소
  color.bgBase:     oklch(0.10 0 0)        # #141414 근사
  color.textBase:   oklch(0.95 0 0)        # rgba(255,255,255,0.85) 근사

surface:
  bgContainer:      oklch(0.13 0 0)        # #1F1F1F
  bgElevated:       oklch(0.17 0 0)        # #262626
  border:           oklch(0.30 0 0)        # #424242

components:
  Card:
    border:         1px solid oklch(0.22 0 0)
    shadow:         none
```

- **추천**: 야간 사용·개발자 도구·집중 모드. 사용자 토글로 라이트와 전환.
- **자동 파생 옵션**: Token Schema §4.1 알고리즘으로 Default에서 자동 생성 가능. 다만 위와 같은 수동 override를 권장(다크에서 채도 과포화 방지).

### 3.3 둥근·친근 (Rounded) — 친근감·가독성 우선

**ID**: `mui` | **Extends**: `default` | **출처**: Material Design 3 + MUI

```yaml
seed:
  color.primary:    oklch(0.50 0.20 305)   # #6750A4 M3 Primary Purple 근사
  color.bgBase:     oklch(0.98 0.01 320)   # #FEF7FF M3 Surface
  color.textBase:   oklch(0.13 0.01 305)
  borderRadius:     12
  fontSize:         14
  fontFamily:       [Roboto, Pretendard, sans-serif]

surface:
  shadowStyle:      medium
  elevation:        1-5단계 (M3 Tonal Elevation)

components:
  Button:
    primary:        { bg: alias.action.primary, text: white, radius: 20, elevation: 1 }
    text:           { bg: transparent, text: alias.action.primary, radius: 20 }
  Card:
    radius:         16
    elevation:      1
    surfaceTint:    alias.action.primary   # M3 Tonal Surface
```

- **추천**: B2C 웹·모바일, 일반 사용자 대상 제품, 마케팅 페이지.
- **회피**: 데이터 밀도 높은 어드민(둥근 모서리로 정보 압축 어려움).

### 3.4 미니멀 (Minimal) — 차분한 모던

**ID**: `shadcn` | **Extends**: `default` | **출처**: shadcn/ui + Radix + Vercel Geist

```yaml
seed:
  color.primary:    oklch(0.20 0.05 250)   # #0F172A zinc-900 근사
  color.bgBase:     oklch(1 0 0)
  color.textBase:   oklch(0.20 0.05 250)
  borderRadius:     8
  fontSize:         14
  fontFamily:       [Inter, Pretendard, sans-serif]

surface:
  shadowStyle:      none
  borderStyle:      1px solid

palette:
  neutral:          zinc                   # shadcn의 stone/zinc/neutral/gray/slate 중 zinc
  muted:            oklch(0.96 0.01 250)
  border:           oklch(0.92 0.01 250)

components:
  Button:
    primary:        { bg: alias.action.primary, text: white }
    secondary:      { bg: muted, text: alias.action.primary }
    outline:        { bg: white, text: alias.action.primary, border: 1px solid border }
    ghost:          { bg: transparent, text: alias.action.primary, hoverBg: muted }
  Input:
    border:         1px solid border
    ringOnFocus:    2px solid alias.action.primary at opacity 0.2
  Card:
    border:         1px solid border
    shadow:         none
```

- **추천**: AI 제품, 개발자 도구, 모던 SaaS.
- **회피**: B2C 마케팅(채도 부족으로 활기 없음), 교육 일반(차가운 톤).

### 3.5 트렌디 (Trendy) — 동적·그라데이션·풍부한 컬러

**ID**: `trendy` | **Extends**: `default` | **출처**: Linear, Vercel marketing, Stripe 2024+ 트렌드

```yaml
seed:
  color.primary:    oklch(0.55 0.25 270)   # 보라·바이올렛 계열 (트렌드)
  color.bgBase:     oklch(0.99 0 0)
  color.textBase:   oklch(0.15 0 0)
  borderRadius:     10
  fontSize:         15
  fontFamily:       [Inter, Pretendard, system-ui]
  density:          default

surface:
  shadowStyle:      colored                 # 색 그림자 (Linear 풍)
  gradient_accents: true                    # 액센트로 그라데이션 사용
  motion:           rich                    # 모션 풍부 (transition 200~300ms)

components:
  Button:
    primary:
      bg:           "linear-gradient(135deg, oklch(0.55 0.25 270), oklch(0.60 0.22 290))"
      text:         white
      shadow:       "0 4px 12px oklch(0.55 0.25 270 / 0.3)"   # 색 그림자
      radius:       10
      hoverTransform: "translateY(-1px)"
  Card:
    bg:             oklch(1 0 0)
    border:         "1px solid oklch(0.94 0.01 270)"
    shadow:         "0 1px 3px rgba(0,0,0,0.05), 0 8px 24px oklch(0.55 0.25 270 / 0.04)"
    radius:         12
  HeroSection:
    bg:             "linear-gradient(135deg, oklch(0.97 0.05 270), oklch(0.95 0.07 290), oklch(0.93 0.06 250))"

extras:
  motion_emphasis:        "transition·hover·scroll-driven animation 적극 활용"
  recommended_components_L4:
    - HeroSection
    - FeatureCard
    - ProductTour
    - PricingTable
  recommended_ux_patterns:
    - "Hero 영역에 그라데이션·색 그림자 활용"
    - "스크롤 진행 인디케이터"
    - "마우스 호버 시 부드러운 transform"
```

- **추천 사용처**: AI 제품 랜딩·마케팅, 신제품 출시, B2C 컨버전 화면.
- **회피**: 데이터 헤비 어드민, 학습 콘텐츠 본문(주의 분산), 접근성 민감 화면 (모션은 `prefers-reduced-motion` 자동 0ms).

### 3.6 유리·블러 (Glass) — 반투명 블러

**ID**: `glass` | **Extends**: `default` | **출처**: Apple Vision Pro, Windows 11 Acrylic

```yaml
seed:
  color.primary:    oklch(0.60 0.20 290)   # #5E5CE6
  color.bgBase:     oklch(0.85 0.10 25)    # 그라데이션의 시작 색 (단색 폴백)
  color.textBase:   oklch(0.98 0 0)        # 반투명 위라 거의 흰색
  borderRadius:     20

surface:
  shadowStyle:      medium
  backdropFilter:   "blur(20px) saturate(180%)"
  borderStyle:      "1px solid rgba(255,255,255,0.25)"
  gradient:         "linear-gradient(135deg, oklch(0.85 0.10 25), oklch(0.75 0.15 305), oklch(0.85 0.20 145))"
  # 주: Glass의 배경 그라데이션은 surface.gradient에 정의. seed.color.bgBase는 단색 폴백(브라우저 미지원 시).

components:
  Card:
    bg:             "rgba(255,255,255,0.15)"
    backdropFilter: "blur(20px) saturate(180%)"
    border:         1px solid rgba(255,255,255,0.25)
    shadow:         "0 8px 32px rgba(0,0,0,0.1)"
  Button:
    primary:
      bg:           "rgba(94,92,230,0.85)"
      backdropFilter: blur(10px)
```

- **추천**: AI 제품의 히어로·랜딩, 모달·팝오버 액센트, 시즈널 캠페인.
- **회피**: 본문 텍스트 중심 화면(가독성 저하), 배경 색이 없는 화면(효과 사라짐).
- **주의**: 단독 사용 금지. 항상 *액센트로만*. 본문은 다른 프리셋 사용.

### 3.7 각진·정밀 (Sharp) — 데이터·모니터링 헤비

**ID**: `geek` | **Extends**: `default` | **출처**: Vercel Geist, Linear, Raycast, GitHub

```yaml
seed:
  color.primary:    oklch(0.60 0.20 245)   # #0070F3
  color.bgBase:     oklch(0 0 0)           # pure black
  color.textBase:   oklch(0.98 0 0)        # near white
  borderRadius:     6
  fontSize:         13                      # 고밀도
  fontFamily:       [Geist Sans, Inter, Pretendard, sans-serif]
  fontFamilyMono:   [Geist Mono, JetBrains Mono, monospace]
  density:          compact

surface:
  bgContainer:      oklch(0.04 0 0)        # #0A0A0A
  bgElevated:       oklch(0.07 0 0)        # #111
  border:           oklch(0.12 0 0)        # #1F1F1F
  shadowStyle:      none

components:
  Button:
    primary:
      bg:           alias.text.body        # 흰색 (인버트)
      text:         alias.surface.base     # 검정
      radius:       6
  Input:
    bg:             surface.bgContainer
    border:         1px solid surface.border
    fontFamily:     {seed.fontFamilyMono}  # 입력은 mono
```

- **추천**: 개발자 콘솔, 로그·모니터링 화면, AI 워크플로우 빌더, AICMS Admin.
- **회피**: 일반 사용자 화면(고밀도가 부담), 학습 콘텐츠.

---

## 4. AI Generate (v0.4)

자연어 톤 묘사 → Seed Token 자동 생성.

**입력 예시**:
```
"차분하고 신뢰감 있는 핀테크 톤, 다크 모드 우선, 미니멀"
```

**출력 (도구가 생성)**:
```json
{
  "id": "ai-generated-{uuid}",
  "name": "AI: 차분하고 신뢰감 있는 핀테크 톤",
  "extends": "default",
  "$extensions": {
    "xds.generated": true,
    "xds.generator": "{LLM_MODEL_ID}",
    "xds.prompt": "차분하고 신뢰감 있는 핀테크 톤, 다크 모드 우선, 미니멀",
    "xds.generatedAt": "2026-05-12T14:23:00+09:00",
    "xds.requiresHumanReview": true
  },
  "seed": { … 자동 생성된 토큰 값 … },
  "_dark": { … 자동 다크모드 … }
}
```

**호출 흐름**:
1. 디자이너가 자연어 톤 묘사 입력 (한국어/영어)
2. 도구가 LLM에 요청 (구조화된 시스템 프롬프트 + JSON 응답 강제)
3. LLM이 OKLCH 좌표·radius·fontFamily 후보 3종 반환
4. 디자이너가 후보 중 하나 선택 → 수동 조정 가능
5. 선택된 후보가 신규 프리셋으로 저장 (라벨에 "AI 생성, 수동 검토 필요" 표시)

**가드레일**:
- 월 호출 한도(예: 50회/사용자, v1.0 시점에 조정)
- 출력 결과는 항상 도구의 검증 규칙(대비비·KWCAG) 통과 후에만 적용 가능
- 작업 로그에 LLM 사용 사실 기록 (Output Spec manifest.json `style.aiGenerated: true`)

---

## 5. 프로젝트 타입 ↔ 프리셋 매핑

| 프로젝트 타입 | ★ 1순위 추천 | 2순위 옵션 |
|---|---|---|
| `admin` (B2B 어드민) | **각진·정밀** | 기본, 다크, 미니멀 |
| `lms` (교육·LMS) | **둥근·친근** | 기본, 미니멀 |
| `ai` (AI 제품) | **미니멀** 또는 **트렌디** | 각진·정밀, 다크, 유리·블러(액센트) |
| `b2c` (B2C 웹·모바일) | **둥근·친근** 또는 **트렌디** | 기본, 유리·블러(캠페인) |

**자동 추천 동작**:
- 프로젝트 생성 시 타입을 고르면 에디터 좌측 패널에서 위 매핑의 추천 프리셋이 ★ 아이콘으로 강조 + 리스트 상단으로 정렬됨.
- 사용자는 추천을 따르거나 무시할 수 있음 (강제 X).

**유리·블러 단독 사용 금지**: 항상 다른 프리셋 위에 액센트로만 사용 (히어로·모달·팝오버).

도구가 프로젝트 타입 선택 시 1순위 프리셋을 기본 추천, 2순위는 옵션 토글로 제시.

---

## 6. 프리셋 상속·잠금 규칙

### 6.1 상속 관계
모든 프리셋은 `default`를 직접 extend (현재 1단계 상속만 허용, 다단계 상속 금지).

### 6.2 자식 프리셋의 override
- 자식이 부모의 토큰 값을 명시적으로 지정하면 그 값이 사용됨
- 명시 안 한 토큰은 부모(default)에서 상속

### 6.3 잠금 (`@locked-override`)
자식 프리셋이 *부모 변경에 영향받지 않을* 토큰은 잠금 표시:
```json
"seed.borderRadius": {
  "$value": 16,
  "$extensions": {
    "xds.locked": true,
    "xds.lockedReason": "Cartoon 톤은 항상 16px borderRadius"
  }
}
```

부모(default)의 borderRadius가 8로 변경되어도 cartoon은 16 유지.

### 6.4 부모 변경 알림
부모(default)의 토큰이 변경되면, 자식 프리셋을 사용 중인 프로젝트에 "표준이 변경되었습니다. 적용하시겠습니까?" 알림 (PRD I4와 연계).

---

## 7. 커스텀 프리셋 (v0.3+)

디자이너가 도구 안에서 자신의 프리셋을 저장 가능:
- 9개 기본 프리셋 중 하나에서 시작 (extends)
- 모든 토큰·surface·component 조정
- "내 프리셋 저장" 버튼 → 회사 차원이 아닌 *개인* 또는 *팀* 라이브러리에 추가
- 회사 표준으로 격상 신청 → 디자인 시스템 오너(P-01) 검토 → 승격 (I3 워크플로, v1.0+)

---

## 8. 프리셋 데이터 저장 위치

```
도구 내부:
/presets/
  ├── default.json
  ├── dark.json
  ├── mui.json
  ├── shadcn.json
  ├── cartoon.json
  ├── illustration.json
  ├── skeuomorphism.json
  ├── glass.json
  ├── geek.json
  └── (v0.3+) custom/
      ├── user_{userId}_{presetId}.json
      └── team_{teamId}_{presetId}.json
```

각 파일은 §2 JSON 스키마를 따름. 도구 빌드 시 정적 import 또는 v0.3+ 동적 fetch.