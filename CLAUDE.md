# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

PII Guard는 LLM(대형 언어 모델) 기반의 개인 식별 정보(PII) 탐지 시스템입니다. 로그에서 민감한 정보를 식별하고 관리하여 GDPR 준수를 지원합니다.

**기술 스택**:
- **백엔드 API**: TypeScript + Hono + Node.js
- **프론트엔드 UI**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **LLM 엔진**: Ollama (기본 모델: `gemma3:1b`)
- **인프라**: PostgreSQL, Elasticsearch, RabbitMQ, Nginx
- **컨테이너**: Docker + Docker Compose

## 개발 환경 설정 및 실행

### 전체 시스템 실행 (All-in-One)

```bash
# 전체 스택 시작 (PostgreSQL, Elasticsearch, RabbitMQ, Ollama, API, UI)
make all-in-up

# 전체 스택 종료
make all-in-down
```

실행 후 접속:
- **웹 UI**: http://localhost:3000
- **API**: http://localhost:8888/api/jobs

### 로컬 개발 환경

```bash
# 로컬 개발 환경 시작 (인프라만 실행하고 앱은 쉘로 진입)
make local-up

# 로컬 개발 환경 종료
make local-down
```

## API 개발 (api/)

### 프로젝트 구조

```
api/src/
├── clients/          # 외부 서비스 클라이언트
│   ├── collect-and-flush/  # 로그 수집 및 일괄 처리
│   ├── db/                  # PostgreSQL 클라이언트
│   ├── llm/                 # LLM API 클라이언트
│   ├── pubsub/              # RabbitMQ 메시지 큐
│   └── search/              # Elasticsearch 클라이언트
├── configs/         # 환경 설정 및 인터페이스
├── jobs/            # Job 관련 비즈니스 로직
│   ├── api/controllers/     # HTTP 컨트롤러
│   ├── dtos/                # 데이터 전송 객체
│   ├── pubsub/              # 메시지 큐 이벤트 핸들러
│   ├── repositories/        # 데이터 저장소
│   └── usecases/            # 비즈니스 로직
├── logger/          # Winston 기반 로깅
├── prompt/          # LLM 프롬프트 템플릿
│   └── pii.prompt.ts        # PII 탐지 프롬프트
├── schemas/         # Zod 스키마 정의
└── _setup_/         # DB 및 Elasticsearch 스키마 초기화
```

### 주요 명령어

```bash
cd api/

# 의존성 설치
npm install

# TypeScript 타입 체크
npm run types:check

# 코드 빌드
npm run build

# 린트 실행
npm run lint
npm run lint:fix

# 포맷팅 체크
npm run format
npm run format:fix

# 스토리지 초기화 (DB + Elasticsearch 스키마)
npm run setup:storage
# 또는 개별적으로:
npm run setup:db          # DB 생성
npm run setup:db:schema   # DB 스키마 생성
npm run setup:search:schema  # Elasticsearch 인덱스 생성

# 애플리케이션 시작 (빌드 + 스토리지 초기화 + 실행)
npm start

# 테스트 실행
npm test
```

### 환경 변수

로컬 개발: `docker/local.env`
All-in-One: `docker/all-in.env`

**필수 환경 변수**:
- `DB_CONNECTION_STRING`: PostgreSQL 연결 문자열
- `QUEUE_URL`: RabbitMQ 연결 URL
- `LLM_API_URL`: LLM 서비스 URL (Ollama 또는 다른 API 엔드포인트)
- `ELASTICSEARCH_URL`: Elasticsearch URL
- `JOB_ELASTICSEARCH_INDEX`: Job 인덱스 이름 (기본: `jobs`)
- `LLM_MODEL`: LLM 모델 이름 (기본: `gemma3:1b`)
- `NEW_JOB_CREATED_TOPIC`: 새 작업 생성 이벤트 토픽
- `JOB_STATUS_UPDATED_TOPIC`: 작업 상태 업데이트 이벤트 토픽
- `LLM_TO_USE`: LLM 제공자 선택 (`'ollama'` 또는 `'openai'`, 기본: `'ollama'`)
- `LLM_API_KEY`: OpenAI API 키 (OpenAI 사용 시 필수)

### LLM 제공자 선택

시스템은 **두 가지 LLM 제공자**를 지원합니다:

1. **Ollama** (기본값):
   - 로컬에서 실행되는 오픈소스 LLM
   - 환경 변수: `LLM_TO_USE='ollama'` (또는 미설정)
   - `LLM_API_URL`: Ollama API 엔드포인트 (예: `http://localhost:11434`)
   - `LLM_MODEL`: 사용할 모델 이름 (예: `gemma3:1b`)

2. **OpenAI**:
   - OpenAI API를 통한 GPT 모델 사용
   - 환경 변수: `LLM_TO_USE='openai'`
   - `LLM_API_KEY`: OpenAI API 키 필수
   - 사용 모델: `gpt-4o` (코드 내 하드코딩, `open-ai.client.ts:46`)
   - JSON 응답 형식 사용

**구현 위치**:
- Ollama 클라이언트: `api/src/clients/llm/ollama.client.ts`
- OpenAI 클라이언트: `api/src/clients/llm/open-ai.client.ts`
- 선택 로직: `api/src/container.ts:30-38`

### 의존성 주입 (Inversify)

이 프로젝트는 Inversify를 사용하여 의존성 주입을 구현합니다. 새로운 서비스를 추가할 때는 `api/src/container.ts`의 컨테이너에 바인딩해야 합니다.

## UI 개발 (ui/)

### 프로젝트 구조

```
ui/src/
├── components/
│   ├── chat/              # 채팅 컴포넌트
│   ├── d3-charts/         # D3.js 기반 차트 (hooks, utils 포함)
│   ├── dashboard/         # 대시보드 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── pii-dashboard/     # PII 대시보드
│   └── ui/                # shadcn/ui 컴포넌트
├── hooks/                 # React 커스텀 훅
├── lib/                   # 유틸리티 라이브러리
├── pages/                 # 페이지 컴포넌트
├── services/              # API 서비스 레이어
└── utils/                 # 유틸리티 함수
```

### 주요 명령어

```bash
cd ui/

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 개발 모드 빌드
npm run build:dev

# 린트 실행
npm run lint

# 프리뷰 (빌드 후 로컬 서버)
npm run preview
```

### UI 기술 스택

- **React 18** + **TypeScript**
- **Vite**: 빌드 도구
- **shadcn/ui**: Radix UI 기반 컴포넌트 시스템
- **Tailwind CSS**: 스타일링
- **TanStack Query**: 서버 상태 관리
- **React Router**: 라우팅
- **D3.js**: 데이터 시각화
- **Recharts**: 차트 라이브러리
- **Zod**: 스키마 검증
- **React Hook Form**: 폼 관리

## 아키텍처 핵심 개념

### 이벤트 기반 아키텍처

시스템은 RabbitMQ를 통한 이벤트 기반 아키텍처를 사용합니다:

1. **Job 생성**: 클라이언트가 로그를 제출하면 Job이 생성되고 `NEW_JOB_CREATED_TOPIC` 이벤트 발행
2. **PII 탐지**: 워커가 이벤트를 구독하여 LLM을 통해 PII 분석 수행
3. **상태 업데이트**: 분석 완료 후 `JOB_STATUS_UPDATED_TOPIC` 이벤트 발행
4. **결과 저장**: Elasticsearch에 탐지 결과 인덱싱

### 데이터 흐름

```
Logs → API (Hono) → Job 생성 (PostgreSQL)
                  ↓
               RabbitMQ (NEW_JOB_CREATED_TOPIC)
                  ↓
         Worker → LLM (Ollama) → PII 탐지
                  ↓
               RabbitMQ (JOB_STATUS_UPDATED_TOPIC)
                  ↓
         Elasticsearch 인덱싱 ← UI (Dashboard)
```

### Zod 스키마 기반 검증

모든 데이터 검증은 Zod 스키마를 사용합니다:
- `api/src/schemas/job.schema.v1.ts`: Job 관련 스키마
- `api/src/schemas/finding.schema.v1.ts`: PII 탐지 결과 스키마
- `api/src/schemas/pii-tags.schema.v1.ts`: PII 타입 정의

### LLM 프롬프트

PII 탐지 프롬프트 템플릿은 `api/src/prompt/pii.prompt.ts`에 정의되어 있습니다. 탐지 정확도를 개선하려면 이 파일의 프롬프트를 수정하세요.

## 테스트

### 통합 테스트 환경

```bash
# PII Guard 전체 스택 시작 후 실행
make test-start

# 테스트 환경 종료
make test-end
```

테스트 환경은 다음을 실행합니다:
- 더미 Nginx 서버
- Fluent Bit (로그 전달)
- Autocannon (부하 테스트)

자세한 내용은 `how-to-test/README.md` 참조.

## PII 타입

시스템이 탐지하는 PII 카테고리:

### 신원 정보
`full-name`, `first-name`, `last-name`, `username`, `email`, `phone-number`, `mobile`, `address`, `postal-code`, `location`

### 민감 카테고리 (GDPR Art. 9)
`racial-or-ethnic-origin`, `political-opinion`, `religious-belief`, `philosophical-belief`, `trade-union-membership`, `genetic-data`, `biometric-data`, `health-data`, `sex-life`, `sexual-orientation`

### 정부 및 금융 식별자
`national-id`, `passport-number`, `driving-license-number`, `ssn`, `vat-number`, `credit-card`, `iban`, `bank-account`

### 네트워크 및 디바이스 정보
`ip-address`, `ip-addresses`, `mac-address`, `imei`, `device-id`, `device-metadata`, `browser-fingerprint`, `cookie-id`, `location-coordinates`

### 차량 정보
`license-plate`

## 샘플 API 요청

```bash
curl --location 'http://localhost:8888/api/jobs/flush' \
--header 'Content-Type: application/json' \
--data-raw '{
  "version": "1.0.0",
  "logs": [
    "{\"timestamp\":\"2025-04-21T15:02:10Z\",\"service\":\"auth-service\",\"level\":\"INFO\",\"event\":\"user_login\",\"requestId\":\"1a9c7e21\",\"user\":{\"id\":\"u9001001\",\"name\":\"Leila Park\",\"email\":\"leila.park@example.io\"},\"srcIp\":\"198.51.100.15\"}"
  ]
}'
```

## 개발 시 주의사항

- **스키마 변경**: Zod 스키마 변경 시 타입 가드 함수 및 팩토리 함수도 함께 업데이트
- **환경 변수**: 새로운 환경 변수 추가 시 `configs.interface.ts`와 `.env` 파일 모두 업데이트
- **메시지 토픽**: 이벤트 토픽 변경 시 publisher와 subscriber 모두 동기화 필요
- **LLM 모델**: LLM 모델 변경 시 `LLM_MODEL` 환경 변수 업데이트 (Ollama 모델 목록 확인 필요)
- **의존성 주입**: 새로운 서비스는 Inversify 컨테이너에 바인딩 필요
