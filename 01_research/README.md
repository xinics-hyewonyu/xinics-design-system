# 01. 주요 디자인 시스템·UI 라이브러리 리서치

> 작성일: 2026-05-12
> 목적: 회사 내부 디자인 시스템 설계 전, 시중의 대표 시스템들을 조사·분석하여 차용·참고할 패턴을 정리한다.

---

## 0. 분류 체계

본 문서에서는 디자인 시스템을 4가지 축으로 분류한다.

| 축 | 설명 | 예시 |
|---|---|---|
| **운영 주체** | 빅테크 / OSS 커뮤니티 / 개별 회사 | Material(Google), shadcn/ui(OSS), Polaris(Shopify) |
| **결합도** | 강결합(컴포넌트 라이브러리 제공) / 약결합(가이드만 제공) | Ant Design vs. Apple HIG |
| **스타일 톤** | 뉴트럴 / 그래픽 / 미니멀 / 스큐어모피즘 | Atlassian / Cartoon / shadcn / Bootstrap classic |
| **타겟 도메인** | B2B Admin / B2C / Mobile / OS-native | Ant Design / Material / Apple HIG / Fluent |

---

## 1. 빅테크 표준 시스템

### 1-1. Ant Design (Alibaba) ★ 핵심 참고
- **URL**: https://ant.design
- **타겟**: B2B 어드민·SaaS·내부 도구
- **핵심 특징**
  - 풍부한 컴포넌트(80+): Table, Form, Tree, Cascader, Transfer 등 데이터 헤비 UI에 강함
  - **Design Token 체계**: Seed Token → Map Token → Alias Token의 3단계
  - **5.0부터 CSS-in-JS**: 동적 테마·다중 테마 동시 적용 가능
  - **테마 커스터마이즈 UI**: Primary Color / Border Radius / Compact 모드를 슬라이더·컬러피커로 조정
- **차용할 패턴**
  - 3단계 토큰 구조 (Seed/Map/Alias)
  - "Customize Theme" UI 패턴 (첨부 이미지의 두 번째)
  - Form·Table의 밀도 높은 데이터 처리 패턴

### 1-2. Material Design (Google)
- **URL**: https://m3.material.io
- **타겟**: Android·웹 B2C·범용
- **핵심 특징**
  - **Material You(M3)**: 사용자 배경화면에서 컬러 팔레트 자동 생성 (Dynamic Color)
  - **Elevation 시스템**: Surface Tint Color로 다크모드에서도 표현
  - **Tonal Palette**: 한 색상에서 13단계 톤 자동 생성
  - **Type Scale**: Display/Headline/Title/Body/Label × Large/Medium/Small의 매트릭스
- **차용할 패턴**
  - Tonal Palette 생성 알고리즘 (베이스 컬러에서 5단계 자동 생성)
  - Type Scale 매트릭스 구조

### 1-3. Apple Human Interface Guidelines (Apple)
- **URL**: https://developer.apple.com/design/human-interface-guidelines
- **타겟**: iOS/macOS/visionOS 네이티브
- **핵심 특징**
  - 컴포넌트 라이브러리 없음 — **가이드 문서 중심**
  - SF Symbols(5,000+ 아이콘), SF Pro 폰트 시스템
  - **플랫폼별 분기**: 같은 컴포넌트도 iOS/macOS/watchOS별 다른 명세
- **차용할 패턴**
  - 컴포넌트 사용 시 "Do / Don't" 시각 예시 패턴
  - 플랫폼별 분기 문서화 방식

### 1-4. Fluent 2 (Microsoft)
- **URL**: https://fluent2.microsoft.design
- **타겟**: Windows·Office·Teams·웹
- **핵심 특징**
  - **Acrylic / Mica**: 반투명 블러 배경 (Windows 11 스타일)
  - **Reveal Highlight**: 마우스 호버 시 빛 번지는 효과
  - 크로스플랫폼: React/Web Components/iOS/Android 동시 지원
- **차용할 패턴**
  - Glass/Acrylic 스타일 프리셋의 레퍼런스

---

## 2. 엔터프라이즈·SaaS 시스템

### 2-1. Atlassian Design System
- **URL**: https://atlassian.design
- **타겟**: Jira·Confluence·Trello — 협업 SaaS
- **핵심 특징**
  - **ADG 4**: 토큰 기반 + 다크모드 정식 지원
  - "Content Design" 섹션: 마이크로카피·라이팅 가이드 별도 제공
  - **Accessibility 등급**을 컴포넌트마다 명시 (WCAG AA/AAA)
- **차용할 패턴**
  - 컴포넌트별 접근성 명세 템플릿
  - 라이팅·마이크로카피 가이드 섹션

### 2-2. Polaris (Shopify)
- **URL**: https://polaris.shopify.com
- **타겟**: 커머스 어드민
- **핵심 특징**
  - **"Patterns" 섹션**: 단일 컴포넌트가 아닌 작업 흐름(데이터 입력·리소스 인덱스·결제 등) 단위 패턴 문서
  - 도덕적 가이드: "Crafted with care, ethics, and accessibility in mind"
- **차용할 패턴**
  - 작업 흐름 단위 패턴 라이브러리 (UX 가이드의 핵심 자료)

### 2-3. Carbon (IBM)
- **URL**: https://carbondesignsystem.com
- **타겟**: 엔터프라이즈·데이터 시각화 헤비
- **핵심 특징**
  - **IBM Plex** 자체 폰트 패밀리
  - **Data Viz 가이드**: 차트 종류별 컬러 팔레트·축·범례 규칙
  - 16px 기준 4의 배수 그리드
- **차용할 패턴**
  - 데이터 시각화 가이드 (LMS·AICMS의 통계 화면에 직접 적용 가능)

### 2-4. Lightning (Salesforce)
- **URL**: https://www.lightningdesignsystem.com
- **타겟**: CRM·세일즈 어드민
- **핵심 특징**: SLDS 토큰, BEM-like 클래스 네이밍
- **차용할 패턴**: 토큰 네이밍 컨벤션 (`--slds-g-color-brand-base-50`)

---

## 3. 모던 OSS·헤드리스 시스템

### 3-1. shadcn/ui ★ 핵심 참고
- **URL**: https://ui.shadcn.com
- **특이성**: "라이브러리가 아닌 코드 컬렉션" — 컴포넌트를 npm 설치가 아닌 **소스 코드 복붙**으로 가져옴
- **핵심 특징**
  - **Radix UI(헤드리스) + Tailwind CSS** 조합
  - 디자인 토큰을 CSS Variables로 정의 (`--background`, `--foreground`, `--primary` 등)
  - **OKLCH 색공간** 사용 (M3와 함께 차세대 표준)
  - "New York" / "Default" 두 가지 스타일 변형
- **차용할 패턴**
  - CSS Variables 기반 토큰 구조
  - 컴포넌트 소스 직접 소유 모델 (의존성 최소화)
  - 스타일 변형(Variant) 시스템 — `cva(class-variance-authority)`

### 3-2. Radix UI (Primitives)
- **URL**: https://www.radix-ui.com
- **특징**: 헤드리스 — 스타일 없이 동작·접근성만 제공
- **차용할 패턴**: 컴포넌트의 동작·접근성 명세 분리 — UI 시스템과 UX 가이드를 분리 작성하는 근거

### 3-3. Mantine
- **URL**: https://mantine.dev
- **타겟**: React 풀스택 (대시보드·SaaS)
- **특징**: 100+ 컴포넌트, Hook 라이브러리(`@mantine/hooks`) 함께 제공, 다크모드 1급
- **차용할 패턴**: Hook 단위로 동작 패턴을 분리 문서화

### 3-4. Chakra UI v3
- **URL**: https://chakra-ui.com
- **특징**: Style Props 패턴(`<Box p={4} bg="blue.500">`), Panda CSS 기반으로 v3 재작성
- **차용할 패턴**: 토큰 별칭(Semantic Token) 시스템

### 3-5. Headless UI (Tailwind Labs)
- **URL**: https://headlessui.com
- **특징**: Radix와 유사하나 Tailwind 진영, Vue/React 동시 지원

### 3-6. Park UI / Ark UI
- **특징**: shadcn 스타일을 Vue·Solid로 확장한 흐름의 대표

### 3-7. Vercel Geist
- **URL**: https://vercel.com/geist
- **타겟**: 개발자 도구·플랫폼 UI
- **특징**: 모노톤·고밀도·SF Mono. "Geek"·"Modern Minimal" 스타일의 표준

### 3-8. Linear Design
- **공개 문서 없음** — 제품 자체가 레퍼런스
- **특징**: 키보드 우선, 그라데이션·다크 기본, 모션이 극단적으로 빠름
- **차용할 패턴**: AI/생성형 제품용 미니멀·모션 가이드

---

## 4. 그래픽·일러스트 톤 시스템

### 4-1. Cartoon / Illustration 계열
- **참고**: Untitled UI Illustration Pack, Open Peeps, Storyset, Humaaans
- **특징**: 컴포넌트보다 일러스트·아이콘·캐릭터 자산이 중심
- **차용 케이스**: LMS·교육 제품의 빈 상태(Empty State), 온보딩

### 4-2. Bootstrap 5
- **URL**: https://getbootstrap.com
- **현재 의의**: "Skeuomorphism" 스타일의 기준점 (그림자·테두리·그라데이션 강조)

### 4-3. Glassmorphism / Neumorphism
- **표준화된 시스템 없음** — 스타일 가이드는 다수 블로그·Dribbble 기준
- **차용 케이스**: AI 제품의 히어로 섹션·랜딩

---

## 5. 한국 회사 사례

### 5-1. Toss Design System (Slash)
- **URL**: https://toss.tech, https://github.com/toss/slash
- **특징**: 한국어 타이포 최적화, 금융 도메인 마이크로카피 가이드
- **차용**: 한국어 본문 가독성 토큰(자간·행간 조정)

### 5-2. Naver / Line / Kakao
- 공개 문서 부분 공개. **Tossface, Line Emoji**처럼 이모지·아이콘 자산 공개가 특징

### 5-3. Wantedly UI
- **URL**: https://design.wantedly.com — 채용 SaaS, B2C 톤이 강한 어드민의 좋은 레퍼런스

---

## 6. 분석 — 우리가 차용할 핵심 패턴 TOP 7

| # | 차용할 패턴 | 출처 | 우리 시스템에서의 역할 |
|---|---|---|---|
| 1 | **3단계 토큰**(Seed→Map→Alias) | Ant Design | 디자인 토큰 JSON 구조의 뼈대 |
| 2 | **CSS Variables 기반 테마** | shadcn/ui | HTML 프리뷰의 실시간 스타일 전환 메커니즘 |
| 3 | **Tonal Palette 자동 생성** | Material M3 | Primary 1개 → 50/100/.../900 자동 도출 |
| 4 | **Type Scale 매트릭스** | M3, Carbon | 타이포 토큰의 명명 규칙 |
| 5 | **Variant 시스템(cva)** | shadcn/ui | 컴포넌트 변형(Primary/Danger/Default/Dashed 등) 정의 방식 |
| 6 | **작업 흐름 단위 패턴** | Polaris | UX 가이드의 단위 — 단일 컴포넌트 X, "리소스 인덱스"·"폼 작성" 등 흐름 단위 |
| 7 | **Customize Theme UI** | Ant Design 5.0 | 스타일 프리뷰 도구의 UX 레퍼런스 |

---

## 7. 회사 제품 유형별 권장 톤 매핑

| 제품 유형 | 권장 베이스 스타일 | 보조 참고 |
|---|---|---|
| **B2B 어드민·SaaS** | Ant Design Default + shadcn 토큰 구조 | Atlassian, Polaris |
| **교육·LMS** | Material M3 (가독성·접근성) + 일러스트 자산 | Carbon(데이터), Toss(한국어 타이포) |
| **AI/생성형** | Vercel Geist + Linear 모션 | shadcn New York, Glass 스타일 액센트 |
| **B2C 웹·모바일** | Material M3 + Apple HIG(iOS 컴포넌트) | Mantine |

---

## 8. 부록 — 빠른 참조 링크

| 시스템 | 도큐먼트 | GitHub |
|---|---|---|
| Ant Design | ant.design | github.com/ant-design/ant-design |
| Material M3 | m3.material.io | github.com/material-components |
| shadcn/ui | ui.shadcn.com | github.com/shadcn-ui/ui |
| Radix | radix-ui.com | github.com/radix-ui |
| Apple HIG | developer.apple.com/design | — |
| Fluent 2 | fluent2.microsoft.design | github.com/microsoft/fluentui |
| Atlassian | atlassian.design | github.com/atlassian/design-system |
| Polaris | polaris.shopify.com | github.com/Shopify/polaris |
| Carbon | carbondesignsystem.com | github.com/carbon-design-system |
| Mantine | mantine.dev | github.com/mantinedev/mantine |
| Chakra | chakra-ui.com | github.com/chakra-ui/chakra-ui |
| Toss Slash | slash.page | github.com/toss/slash |