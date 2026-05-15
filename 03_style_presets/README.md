# 03. 스타일 프리셋 정의서

> 작성일: 2026-05-12
> 목적: XDS의 9개 스타일 프리셋 각각의 시각 톤·토큰·컴포넌트 변형 규칙을 정의한다.
> 사용처: 인터랙티브 프리뷰 도구(`tools/preview.html`)의 데이터 소스 + 각 프리셋의 MD 추출 베이스.

---

## 공통 토큰 키 정의

모든 프리셋은 동일한 토큰 키를 갖는다. 값만 다르다.

```yaml
seed:
  colorPrimary:     # 주요 액션·링크·강조
  colorSuccess:     # 성공·완료
  colorWarning:     # 주의
  colorError:       # 위험·오류
  colorBgBase:      # 페이지 배경
  colorTextBase:    # 본문 텍스트
  borderRadius:     # 컴포넌트 모서리 (px)
  fontSize:         # 본문 기본 (px)
  fontFamily:       # 본문 폰트 스택
  shadowStyle:      # 'none' | 'minimal' | 'medium' | 'heavy'
  density:          # 'compact' | 'default' | 'comfortable'
```

---

## 1. Default Style — 회사 표준

```yaml
id: default
name: Default Style
inspiration: Ant Design 5.0 + 자체 보강
use_case: B2B 어드민, 내부 도구, SaaS의 기본값

seed:
  colorPrimary:    "#1677FF"
  colorSuccess:    "#52C41A"
  colorWarning:    "#FAAD14"
  colorError:      "#FF4D4F"
  colorBgBase:     "#FFFFFF"
  colorTextBase:   "#000000E0"   # rgba(0,0,0,0.88)
  borderRadius:    6
  fontSize:        14
  fontFamily:      "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
  shadowStyle:     minimal
  density:         default

components:
  Button:
    primary:   { bg: colorPrimary,  text: white,  border: none }
    danger:    { bg: colorError,    text: white,  border: none }
    default:   { bg: white,         text: textBase, border: "1px solid #D9D9D9" }
    dashed:    { bg: white,         text: textBase, border: "1px dashed #D9D9D9" }
  Input:
    height: 32
    paddingX: 11
    borderRadius: 6
  Card:
    border: "1px solid #F0F0F0"
    shadow: "0 1px 2px rgba(0,0,0,0.03)"
```

**적용 케이스**: AICMS 어드민, 내부 운영툴, 모든 신규 프로젝트의 기본값

---

## 2. Dark Style — 어두운 환경

```yaml
id: dark
name: Dark Style
inspiration: Ant Design Dark + GitHub Dark
extends: default
use_case: 야간 사용·개발자 도구·집중 모드

seed:
  colorPrimary:    "#1668DC"
  colorBgBase:     "#141414"
  colorTextBase:   "#FFFFFFD9"   # rgba(255,255,255,0.85)
  # 나머지는 default 상속

surface:
  bgContainer:     "#1F1F1F"
  bgElevated:      "#262626"
  border:          "#424242"

components:
  Card:
    border: "1px solid #303030"
    shadow: "none"
```

**전환 규칙**: 모든 스타일은 `*-dark` 변형을 자동 생성 (Material M3의 Tonal Palette 알고리즘 사용)

---

## 3. MUI-like Style — 둥글고 친근한 톤

```yaml
id: mui
name: MUI-like Style
inspiration: Material Design 3 + MUI
use_case: B2C 웹·모바일, 일반 사용자 대상 제품

seed:
  colorPrimary:    "#6750A4"     # M3 Primary Purple
  colorBgBase:     "#FEF7FF"     # M3 Surface
  colorTextBase:   "#1D1B20"
  borderRadius:    12
  fontSize:        14
  fontFamily:      "Roboto, Pretendard, sans-serif"
  shadowStyle:     medium

components:
  Button:
    primary:   { bg: colorPrimary, text: white, borderRadius: 20, elevation: 1 }
    text:      { bg: transparent, text: colorPrimary }
  Card:
    borderRadius: 16
    elevation: 1
    surfaceTint: colorPrimary   # M3 Tonal Elevation
```

---

## 4. shadcn-like Style — 모던 미니멀

```yaml
id: shadcn
name: shadcn-like Style
inspiration: shadcn/ui + Radix + Vercel Geist
use_case: AI 제품, 개발자 도구, 모던 SaaS

seed:
  colorPrimary:    "#0F172A"     # zinc-900
  colorBgBase:     "#FFFFFF"
  colorTextBase:   "#0F172A"
  borderRadius:    8
  fontSize:        14
  fontFamily:      "Inter, Pretendard, sans-serif"
  shadowStyle:     none
  density:         default

palette:
  neutral:         zinc           # shadcn의 stone/zinc/neutral/gray/slate 중 선택
  muted:           "#F1F5F9"
  border:          "#E2E8F0"

components:
  Button:
    primary:   { bg: colorPrimary, text: white }
    secondary: { bg: muted, text: colorPrimary }
    outline:   { bg: white, text: colorPrimary, border: "1px solid border" }
    ghost:     { bg: transparent, text: colorPrimary, hoverBg: muted }
  Input:
    border: "1px solid border"
    ringOnFocus: "2px solid colorPrimary/20"
  Card:
    border: "1px solid border"
    shadow: none
```

**핵심 차별점**: 채도 매우 낮음, focus ring 강조, 그림자 거의 없음

---

## 5. Cartoon Style — 굵고 친근한 톤

```yaml
id: cartoon
name: Cartoon Style
inspiration: Notion Sketchy, Excalidraw, 손그림 톤
use_case: 교육 제품 일부, 어린이·학생 대상, 온보딩·튜토리얼

seed:
  colorPrimary:    "#FF6B6B"
  colorSuccess:    "#51CF66"
  colorWarning:    "#FFD43B"
  colorError:      "#FF6B6B"
  colorBgBase:     "#FFF9F0"
  colorTextBase:   "#212529"
  borderRadius:    16
  fontSize:        15
  fontFamily:      "Comic Neue, Pretendard, sans-serif"
  shadowStyle:     heavy

components:
  Button:
    primary:
      bg: colorPrimary
      text: white
      border: "3px solid #212529"
      shadow: "4px 4px 0 #212529"     # 옵셋 솔리드 그림자
      borderRadius: 16
  Card:
    border: "3px solid #212529"
    shadow: "6px 6px 0 #212529"
```

**핵심 차별점**: 검은 굵은 stroke, 옵셋 솔리드 그림자, 손글씨 폰트

---

## 6. Illustration Style — 일러스트 통합

```yaml
id: illustration
name: Illustration Style
inspiration: Storyset, Untitled UI Illustration, Humaaans
use_case: LMS 빈 상태·온보딩, 마케팅 페이지, 학습 콘텐츠 카드

seed: { ...default 상속 }

extras:
  illustration_asset_set: "xinics-edu-pack-v1"
  empty_state_pattern: "always illustrated"
  hero_pattern: "illustration + headline + CTA"

components:
  EmptyState:
    structure: "Illustration (180px) + Title + Body + CTA"
    illustration_count: 24    # 도메인별 24종 자산
  OnboardingStep:
    structure: "Illustration + Step Title + Description"
```

**핵심 차별점**: 토큰보다 **자산(asset)** 중심. 일러스트 24종을 빈 상태·온보딩에 매핑.

---

## 7. Bootstrap Skeuomorphism — 클래식

```yaml
id: skeuomorphism
name: Bootstrap Skeuomorphism
inspiration: Bootstrap 4 이전 + iOS 6 이전
use_case: 레거시 호환, 그라데이션·입체감이 필요한 마케팅 페이지

seed:
  colorPrimary:    "#007BFF"
  colorBgBase:     "#F8F9FA"
  borderRadius:    4
  shadowStyle:     heavy

components:
  Button:
    primary:
      bg: "linear-gradient(180deg, #2D8CFF 0%, #007BFF 100%)"
      border: "1px solid #006FE6"
      shadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)"
      borderRadius: 4
  Card:
    bg: "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)"
    border: "1px solid #DEE2E6"
    shadow: "0 4px 8px rgba(0,0,0,0.08)"
```

---

## 8. Glass Style — 반투명 블러

```yaml
id: glass
name: Glass Style
inspiration: Apple Vision Pro, Windows 11 Acrylic
use_case: AI 제품의 히어로·랜딩, 모달·팝오버 액센트

seed:
  colorPrimary:    "#5E5CE6"
  colorBgBase:     "linear-gradient(135deg, #FF9A8B 0%, #A18CD1 50%, #84FAB0 100%)"
  colorTextBase:   "#FFFFFFF2"
  borderRadius:    20
  shadowStyle:     medium

components:
  Card:
    bg: "rgba(255,255,255,0.15)"
    backdropFilter: "blur(20px) saturate(180%)"
    border: "1px solid rgba(255,255,255,0.25)"
    shadow: "0 8px 32px rgba(0,0,0,0.1)"
  Button:
    primary:
      bg: "rgba(94,92,230,0.85)"
      backdropFilter: "blur(10px)"
```

**주의**: 배경에 충분한 색·이미지가 있어야 효과가 살아남. 단독 사용 X, 액센트로 사용.

---

## 9. Geek Style — 개발자 도구·고밀도

```yaml
id: geek
name: Geek Style
inspiration: Vercel Geist, Linear, Raycast, GitHub
use_case: 개발자 콘솔, 로그·모니터링 화면, AI 워크플로우 빌더

seed:
  colorPrimary:    "#0070F3"
  colorBgBase:     "#000000"
  colorTextBase:   "#FAFAFA"
  borderRadius:    6
  fontSize:        13
  fontFamily:      "Geist Sans, Inter, Pretendard, sans-serif"
  fontFamilyMono:  "Geist Mono, JetBrains Mono, monospace"
  shadowStyle:     none
  density:         compact

surface:
  bgContainer:     "#0A0A0A"
  bgElevated:      "#111111"
  border:          "#1F1F1F"

components:
  Button:
    primary:
      bg: colorTextBase
      text: colorBgBase     # 인버트
      borderRadius: 6
  Input:
    bg: bgContainer
    border: "1px solid border"
    fontFamily: fontFamilyMono   # 입력은 mono
```

**핵심 차별점**: 흑백 베이스, mono 폰트 혼용, 극도의 고밀도

---

## 10. AI Generate Theme — 미래 확장

```yaml
id: ai-generated
name: AI Generate Theme
status: roadmap   # 1차 미구현
use_case: 사용자가 자연어로 톤 묘사 → 토큰 자동 생성

input_example: "차분하고 신뢰감 있는 핀테크 톤, 다크 모드 우선"
output: 완전한 seed/map/alias 토큰 세트 + 컴포넌트 변형 매핑

implementation: Claude `askClaude` API + 사전 학습된 토큰 생성 규칙
```

---

## 프리셋 ↔ 회사 제품 매핑

| 제품 | 1순위 | 2순위 (액센트) |
|---|---|---|
| AICMS | `shadcn` | `glass` (AI 생성 결과 카드) |
| LMS | `mui` 또는 `default` | `illustration` (빈 상태·온보딩) |
| 내부 어드민 | `default` | `dark` (다크 토글) |
| AI Studio | `geek` | `glass` |
| 마케팅 페이지 | `mui` | `illustration` |

---

## 컴포넌트 커버리지 (1차 — 모든 프리셋이 지원해야 함)

| 카테고리 | 컴포넌트 |
|---|---|
| Action | Button, IconButton, Switch, Toggle |
| Input | Input, Textarea, Select, DatePicker, Checkbox, Radio, Slider, ColorPicker |
| Display | Card, Badge, Tag, Avatar, Progress, Steps |
| Feedback | Modal, Toast, Alert, Tooltip |
| Navigation | Tabs, Breadcrumb, Pagination, Menu |
| Data | Table, List, Tree |

첨부 이미지의 우측 프리뷰 영역에 등장하는 컴포넌트(Modal/Input/Dropdown/ColorPicker/Tags/DatePicker/Progress/Steps/Slider/Button/Switch/Checkbox/Radio/SegmentedControl)는 모두 1차 커버리지에 포함됨.

---

## MD 추출 양식 (각 프리셋의 익스포트 결과)

`tools/preview.html`에서 "Download MD" 버튼 클릭 시 아래 양식으로 생성.

```markdown
# {프리셋명} — XDS Style Sheet

> Generated: {날짜}
> Base: {extends}

## Tokens

### Seed
| Token | Value |
| color.primary | #... |
...

### Components

#### Button — Primary
- Background: ...
- Text Color: ...
- Border: ...
- Border Radius: ...px
- Hover: ...
- Focus: ...

[모든 컴포넌트 반복]

## Usage Guide
- 적용 케이스: ...
- 주의사항: ...
- 회사 제품 매핑: ...
```

---

## 다음 단계

본 정의서를 바탕으로 `tools/preview.html`을 제작한다. 첨부 이미지 두 장의 UX를 결합:
1. **좌측**: 본 문서의 9개 프리셋 리스트 (선택 가능)
2. **우측 상단**: Ant Design Customize Theme처럼 Primary Color·Border Radius·Density 슬라이더
3. **우측 본문**: 프리셋 + 슬라이더 값이 즉시 반영된 컴포넌트 카탈로그
4. **상단 우측**: "Download .md" / "Download tokens.json" 버튼