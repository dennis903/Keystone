# Keystone 학습 체크리스트

> 앱에 필요한 백엔드 기능을 하나씩 구현하며 **Top-down(흐름·사용법)** 과 **Bottom-up(원리·직접 구현)** 으로 백엔드를 이해한다.
> 스펙: NestJS · PostgreSQL · Docker / docker-compose

**표기**

- **Top-down**: 기능을 완성하며 익힐 것
- **Bottom-up**: 원리를 설명하거나 직접 구현할 수 있어야 하는 것
- **AI 검증**: AI가 만든 코드에서 반드시 확인할 것

🎯 = "한 번 제대로 뚫을" 구간. **Bottom-up으로 완주한다.**

---

## 0. 🎯 한 번 제대로 뚫기 규칙

- [ ] 이메일 로그인 + JWT 구간은 `@nestjs/passport` 없이 Guard를 직접 작성한다
- [ ] JWT 서명 검증을 한 번은 손으로 해본다 (base64url 디코드 → HMAC 계산 → 비교)
- [ ] 해싱은 라이브러리를 쓰되 salt, cost, 타이밍 공격을 설명할 수 있다
- [ ] AI에게 "짜줘"가 아니라 "내 코드를 리뷰해줘 / 이 공격이 통하는지 검증해줘"로 요청한다

---

## 0-1. 공통 기반

### Docker / docker-compose

**Top-down**

- [ ] compose로 NestJS + PostgreSQL (+ Redis, MinIO, Mailpit) 로컬 환경 구성
- [ ] `.env`와 `@nestjs/config`로 환경 변수 관리
- [ ] 볼륨으로 DB 데이터 유지

**Bottom-up**

- [ ] 이미지와 컨테이너의 차이
- [ ] 레이어와 빌드 캐시, 멀티 스테이지 빌드
- [ ] 컨테이너 네트워크: 서비스명으로 DNS가 해석되는 원리
- [ ] `depends_on`은 시작 순서만 보장 → `healthcheck` + `service_healthy`가 필요한 이유

**AI 검증**

- [ ] 컨테이너 안에서 `localhost`로 DB에 접속하는 코드가 없는가
- [ ] `version:` 필드 등 구버전 compose 문법이 없는가

### NestJS

**Top-down**

- [ ] Module / Controller / Service / Provider 구조
- [ ] DTO + `class-validator`
- [ ] `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`

**Bottom-up**

- [ ] IoC / DI 컨테이너: 의존성을 누가, 언제, 어떤 스코프로 생성하는가
- [ ] 데코레이터와 `reflect-metadata`로 메타데이터를 읽는 원리
- [ ] 요청 생명주기: Middleware → Guard → Interceptor → Pipe → Handler → Interceptor → Exception Filter
- [ ] Nest 없이 Express로 같은 API를 한 번 짜보기

### PostgreSQL / ORM

**Top-down**

- [ ] Entity 설계와 관계 매핑
- [ ] 마이그레이션 생성 및 실행

**Bottom-up**

- [ ] B-Tree 인덱스와 `EXPLAIN ANALYZE`
- [ ] 트랜잭션과 격리 수준, Lost update
- [ ] Unique / Partial index / FK 제약이 최종 방어선인 이유
- [ ] N+1 문제, ORM이 생성하는 SQL 직접 읽기

**AI 검증**

- [ ] 운영 설정에 `synchronize: true`가 없는가
- [ ] 여러 테이블 갱신이 트랜잭션으로 묶여 있는가

---

## 1. 인증 및 인가

### 1-1. 🎯 이메일 회원가입 · 로그인

**Top-down**

- [ ] DTO 검증 → 해싱 → 저장 → 비교 → 토큰 발급 흐름 구현
- [ ] argon2id 또는 bcrypt 사용

**Bottom-up**

- [ ] 해시와 암호화의 차이
- [ ] salt의 역할 (레인보우 테이블 방어)
- [ ] cost factor: 느린 해시가 좋은 이유
- [ ] bcrypt의 72바이트 입력 제한
- [ ] 타이밍 공격과 상수 시간 비교
- [ ] 사용자 열거 방지: "이메일 없음"과 "비밀번호 틀림"을 같은 응답으로
- [ ] 이메일 정규화 (대소문자, 공백)

**AI 검증**

- [ ] MD5/SHA-256 단독 해싱이나 salt 없는 해싱이 없는가
- [ ] 응답에 `password` 필드가 섞여 나가지 않는가

### 1-2. 🎯 JWT Access / Refresh

**Top-down**

- [ ] 짧은 Access + 긴 Refresh 발급
- [ ] `/auth/refresh`, `/auth/logout` 구현
- [ ] Guard에서 Access 검증 후 `req.user` 주입

**Bottom-up**

- [ ] `header.payload.signature` 구조, base64url
- [ ] JWT는 서명이지 암호화가 아니다 (payload는 누구나 읽음)
- [ ] HS256(대칭)과 RS256/ES256(비대칭)의 차이
- [ ] 표준 클레임: `exp`, `iat`, `sub`, `jti`, `iss`, `aud`
- [ ] Stateless의 한계: 발급된 Access는 만료 전까지 회수 불가 → 짧은 TTL
- [ ] Refresh 토큰을 DB에 해시로 저장
- [ ] 토큰 패밀리(`familyId`) 개념
- [ ] 로테이션: 사용 시 새 토큰 발급, 이전 토큰 사용 처리
- [ ] 재사용 감지: 이미 쓴 refresh가 다시 오면 패밀리 전체 폐기
- [ ] 앱이 refresh를 동시에 2번 보낼 때의 경합 처리
- [ ] 토큰 저장 위치: 웹 HttpOnly 쿠키 vs 모바일 Keychain / Keystore

**AI 검증**

- [ ] `alg: none` 허용 또는 알고리즘 미고정 검증이 없는가
- [ ] Refresh 토큰을 평문으로 저장하지 않는가
- [ ] 로그아웃이 "클라이언트에서 토큰 삭제"로만 끝나지 않는가

### 1-3. 소셜 로그인 (Google, Apple, Kakao, Naver)

**Top-down**

- [ ] 네이티브 SDK 토큰 → 서버 검증 → 서비스 JWT 발급 흐름
- [ ] 제공자별 사용자 정보 매핑

**Bottom-up**

- [ ] OAuth 2.0(인가)과 OpenID Connect(인증)의 차이
- [ ] Authorization Code Flow + PKCE가 모바일에서 필요한 이유
- [ ] id_token 검증: JWKS 조회 → 서명 → `iss`, `aud`, `exp`, `nonce`
- [ ] Kakao / Naver: access token으로 사용자 정보 API를 호출하는 방식
- [ ] Apple `client_secret`은 ES256으로 서명한 JWT
- [ ] Apple 이메일·이름은 최초 로그인 시에만 제공, Private Relay 이메일
- [ ] `state` 파라미터와 CSRF

**AI 검증**

- [ ] id_token을 디코드만 하고 서명 검증을 빠뜨리지 않았는가
- [ ] `aud` 검증이 있는가
- [ ] Apple 이름을 매번 받을 수 있다고 가정하지 않았는가

### 1-4. 계정 연동

**Top-down**

- [ ] `users` 1 : N `auth_providers(provider, provider_user_id)` 구조
- [ ] 로그인 상태에서 "계정 연결하기" API

**Bottom-up**

- [ ] 식별자는 이메일이 아니라 `(provider, provider_user_id)`
- [ ] 미인증 이메일로 자동 병합하면 계정 탈취가 가능한 이유
- [ ] 병합 정책 비교: 자동 병합 vs 명시적 연결 vs 기존 계정 인증 요구
- [ ] `(provider, provider_user_id)` 유니크 제약
- [ ] 마지막 로그인 수단 해제 방지

**AI 검증**

- [ ] 이메일이 같다는 이유만으로 병합하지 않는가

### 1-5. 이메일 인증 · 비밀번호 재설정

**Top-down**

- [ ] 토큰 생성 → 메일 발송 → 링크/딥링크 → 검증 → 처리

**Bottom-up**

- [ ] `crypto.randomBytes`(CSPRNG)와 `Math.random`의 차이
- [ ] 토큰 해시 저장, `expires_at`, `used_at`으로 1회성 보장
- [ ] 사용 처리와 비밀번호 변경을 하나의 트랜잭션으로
- [ ] 재설정 성공 시 기존 세션과 refresh 토큰 전부 폐기
- [ ] 재설정 요청 API의 사용자 열거 방지
- [ ] JWT 토큰과 DB 토큰의 트레이드오프

**AI 검증**

- [ ] 토큰 평문 저장, 재사용 가능 토큰, 세션 폐기 누락이 없는가

### 1-6. 회원 탈퇴

**Top-down**

- [ ] `DELETE /me` → `deleted_at` 기록 → 유예 후 크론으로 삭제/익명화
- [ ] TypeORM `@DeleteDateColumn`, `softDelete`

**Bottom-up**

- [ ] Apple의 앱 내 탈퇴 필수 정책, Google Play의 웹 탈퇴 경로 요구
- [ ] Apple 로그인 사용자 탈퇴 시 토큰 revoke API 호출
- [ ] 소프트 삭제된 이메일과 유니크 제약 충돌 → Partial unique index
- [ ] 하드 삭제 vs 익명화: FK로 연결된 데이터 처리
- [ ] 개인정보 법적 보관 기간과 삭제 의무의 균형
- [ ] 탈퇴 시 활성 구독 안내

**AI 검증**

- [ ] 소프트 삭제된 사용자가 조회에 섞이지 않는가
- [ ] Apple revoke가 빠지지 않았는가

### 1-7. 멀티 디바이스 세션 관리

**Top-down**

- [ ] `sessions` 테이블 (기기명, OS, 마지막 활동, IP, refresh family)
- [ ] 세션 목록 / 특정 세션 종료 / 현재 기기 제외 전체 종료

**Bottom-up**

- [ ] 세션 = refresh 토큰 패밀리 단위로 보는 설계
- [ ] 세션을 끊어도 Access 토큰은 만료 전까지 유효함
- [ ] 대응 방식 비교: 짧은 TTL / `sid` + 거부 목록 / 토큰 버전 필드
- [ ] 각 방식의 비용 (매 요청 조회 vs 즉시성)

**AI 검증**

- [ ] "세션 삭제 = 즉시 로그아웃"이라고 가정하지 않는가

### 1-8. 권한 (user / admin)

**Top-down**

- [ ] `@Roles('admin')` + `RolesGuard` + `Reflector`
- [ ] 전역 Guard + `@Public()` 패턴

**Bottom-up**

- [ ] 인증(401)과 인가(403)의 차이
- [ ] RBAC와 ABAC의 차이
- [ ] IDOR: 역할 검사 외에 리소스 소유권 검사가 필요한 이유
- [ ] Guard 실행 순서

**AI 검증**

- [ ] 수정·삭제 API에 소유권 검사가 있는가

---

## 2. 사용자 · 파일

### 2-1. 프로필 CRUD, 닉네임 중복 체크

**Top-down**

- [ ] `GET/PATCH /me`
- [ ] 닉네임 사용 가능 여부 API

**Bottom-up**

- [ ] 중복 체크 API는 UX용, 최종 보장은 DB 유니크 제약 (TOCTOU)
- [ ] PostgreSQL `23505` 에러를 도메인 에러로 변환
- [ ] 대소문자 무시 유니크 (`lower()` 인덱스 또는 `citext`)
- [ ] 유니코드 정규화(NFC): 한글 자모 조합 차이 문제
- [ ] PUT과 PATCH, `undefined`와 `null`의 구분

**AI 검증**

- [ ] `findOne` 후 `save`만으로 중복을 막았다고 하지 않는가

### 2-2. 이미지 업로드

**Top-down**

- [ ] URL 요청 → 클라이언트가 S3에 직접 PUT → 완료 알림 → 썸네일 생성
- [ ] 로컬 MinIO 구성
- [ ] `sharp`로 리사이징

**Bottom-up**

- [ ] 서버를 거치지 않는 직접 업로드의 이점
- [ ] Presigned URL = 시간 제한 있는 권한 위임
- [ ] Presigned PUT vs POST (POST 정책으로 크기·타입 강제)
- [ ] 업로드 완료 확인: 클라이언트 콜백 vs S3 이벤트
- [ ] 리사이징을 백그라운드 작업으로 분리
- [ ] EXIF 회전 처리와 위치 메타데이터 제거
- [ ] 고아 파일 정리

**AI 검증**

- [ ] 크기·타입 제한이 있는가
- [ ] 객체 키에 사용자 파일명을 그대로 쓰지 않는가

---

## 3. 알림

### 3-1. 푸시 알림

**Top-down**

- [ ] `firebase-admin`으로 FCM 발송
- [ ] `device_tokens` 테이블 (user, token, platform, 앱 버전, 갱신일)

**Bottom-up**

- [ ] 전달 구조: 서버 → FCM/APNs → OS → 앱
- [ ] FCM HTTP v1 API와 서비스 계정 인증
- [ ] APNs 토큰 기반 인증(.p8)
- [ ] 토큰 업서트, 에러 응답(`UNREGISTERED` 등) 시 토큰 삭제
- [ ] notification 메시지 vs data 메시지
- [ ] 로그아웃 시 토큰 해제, 한 기기 여러 계정 문제
- [ ] 대량 발송의 큐 분리

**AI 검증**

- [ ] 레거시 FCM API(server key) 예제가 아닌가

### 3-2. 이메일 발송

**Top-down**

- [ ] Nodemailer 또는 API 기반 서비스 연동
- [ ] Handlebars / MJML 템플릿
- [ ] 로컬 Mailpit으로 확인

**Bottom-up**

- [ ] 트랜잭셔널 메일과 마케팅 메일의 차이
- [ ] SPF / DKIM / DMARC
- [ ] 발송을 큐로 분리하고 재시도
- [ ] 반송·수신 거부 처리

**AI 검증**

- [ ] 메일 발송을 `await`해서 API 응답이 느려지지 않는가

### 3-3. 인앱 알림함

**Top-down**

- [ ] `notifications` 테이블 (user_id, type, payload, read_at, created_at)
- [ ] 목록, 단건/전체 읽음, 안 읽은 수

**Bottom-up**

- [ ] `is_read`와 `read_at`의 차이
- [ ] `(user_id, created_at)` 복합 인덱스
- [ ] 안 읽은 수 집계 비용과 캐싱
- [ ] fan-out on write vs fan-out on read
- [ ] 보관 기간과 정리 크론

**AI 검증**

- [ ] 매 요청마다 전체 `COUNT(*)`를 돌지 않는가

---

## 4. 결제 · 구독

### 4-1. 인앱결제 영수증 검증

**Top-down**

- [ ] 앱 구매 → 서버 전달 → 스토어 API 검증 → 권한 부여
- [ ] App Store Server API 연동
- [ ] Google Play Developer API (`subscriptionsv2`) 연동

**Bottom-up**

- [ ] 클라이언트를 믿지 않는 이유 (위조, 재사용)
- [ ] Apple JWS 서명 트랜잭션 검증 (x5c 인증서 체인)
- [ ] Google 3일 내 acknowledge 하지 않으면 자동 환불
- [ ] 사용자 매핑: Apple `appAccountToken`, Google `obfuscatedAccountId`
- [ ] `originalTransactionId` / `purchaseToken` 유니크 처리
- [ ] Sandbox / 테스트 트랙 환경 분리

**AI 검증**

- [ ] deprecated된 `verifyReceipt` 기반 코드가 아닌가
- [ ] JWS 서명 검증이 있는가

### 4-2. 서버 알림(Webhook) 수신

**Top-down**

- [ ] App Store Server Notifications V2 (`signedPayload`) 수신
- [ ] Google RTDN (Cloud Pub/Sub 푸시) 수신

**Bottom-up**

- [ ] 웹훅은 신뢰할 수 없는 외부 입력 → 서명 검증 우선
- [ ] 멱등성: notification ID 저장
- [ ] 순서 보장 없음 → 이벤트 시간 기준 처리 또는 최신 상태 재조회
- [ ] 빠르게 200 응답 후 큐에서 처리
- [ ] 구독 상태 머신: 활성 / 갱신 / 유예 / 재시도 / 만료 / 환불

**AI 검증**

- [ ] 예외 시 재시도 폭주나 중복 처리가 없는가

### 4-3. 구독 상태 조회 API

**Top-down**

- [ ] `GET /me/entitlements`
- [ ] `@RequiresPremium()` Guard

**Bottom-up**

- [ ] Entitlement(권한)와 Subscription(결제 상태) 분리
- [ ] 진실의 원천은 서버, 앱은 캐시
- [ ] 만료 시각 판단과 유예 기간 정책

**AI 검증**

- [ ] 클라이언트가 보낸 `isPremium`을 신뢰하지 않는가

---

## 5. 앱 운영

### 5-1. 강제 / 권장 업데이트 체크

**Top-down**

- [ ] 플랫폼·버전을 받아 `{ force, recommend, storeUrl }` 응답

**Bottom-up**

- [ ] 시맨틱 버저닝 비교 (`"1.10.0"` vs `"1.9.0"` 문자열 비교 함정)
- [ ] 플랫폼별 최소 버전, 스토어 심사 지연 고려
- [ ] 인증 없이 호출 가능해야 하는 이유

**AI 검증**

- [ ] 버전을 문자열로 비교하지 않는가

### 5-2. 원격 설정, Feature Flag

**Top-down**

- [ ] 설정 테이블 + 조회 API + 캐싱
- [ ] 관리자 수정 API

**Bottom-up**

- [ ] 점진적 배포: `hash(userId + flagKey) % 100 < rollout%`
- [ ] 타게팅 조건 (플랫폼, 앱 버전, 국가)
- [ ] 캐시 무효화와 기본값(fallback) 설계
- [ ] Kill switch로서의 플래그

**AI 검증**

- [ ] `Math.random()`으로 롤아웃을 결정하지 않는가

### 5-3. 공지사항, 점검 모드

**Top-down**

- [ ] 노출 기간이 있는 공지 CRUD
- [ ] 점검 모드 플래그

**Bottom-up**

- [ ] 점검 미들웨어: 503 + `Retry-After`
- [ ] 관리자·헬스체크 경로 예외
- [ ] 예약 점검 (시작/종료 시각)

**AI 검증**

- [ ] 점검 중 헬스체크까지 막지 않는가

### 5-4. 신고, 차단

**Top-down**

- [ ] `reports`, `blocks` 테이블
- [ ] 신고 처리 관리자 API

**Bottom-up**

- [ ] UGC 정책 요구사항: 필터링, 신고, 차단, 운영자 연락 수단
- [ ] 차단의 양방향 필터링을 모든 조회에 일관 적용
- [ ] 중복 신고 처리, 누적 시 자동 숨김
- [ ] 모더레이션 큐와 처리 이력

**AI 검증**

- [ ] 상세·검색·알림에도 차단 필터가 적용됐는가

---

## 6. 공통 인프라

### 6-1. Rate Limiting

**Top-down**

- [ ] `@nestjs/throttler` 적용
- [ ] 로그인·인증 메일은 엄격한 제한

**Bottom-up**

- [ ] Fixed Window / Sliding Window / Token Bucket
- [ ] 다중 인스턴스에서 Redis 저장소가 필요한 이유
- [ ] 키 기준: IP vs 사용자 vs 이메일
- [ ] 프록시 뒤 실제 IP (`trust proxy`, `X-Forwarded-For` 위조)
- [ ] 429 + `Retry-After`

**AI 검증**

- [ ] 프록시 환경에서 모든 요청이 같은 IP로 잡히지 않는가

### 6-2. 요청 로깅, 에러 모니터링

**Top-down**

- [ ] 로깅 Interceptor, `nestjs-pino`
- [ ] Sentry SDK 연동

**Bottom-up**

- [ ] 구조화 로그(JSON)와 로그 레벨
- [ ] Request ID: `AsyncLocalStorage`로 요청 컨텍스트 전파
- [ ] 개인정보·토큰·비밀번호 마스킹
- [ ] 4xx와 5xx 리포팅 구분
- [ ] 소스맵 업로드

**AI 검증**

- [ ] 요청 body 전체를 로그에 남기지 않는가

### 6-3. 에러 응답 포맷, API 버저닝

**Top-down**

- [ ] 전역 Exception Filter
- [ ] `enableVersioning({ type: VersioningType.URI })`

**Bottom-up**

- [ ] RFC 9457 Problem Details
- [ ] HTTP 상태 코드와 도메인 에러 코드 분리
- [ ] 내부 정보(DB 에러, 스택) 노출 금지
- [ ] 모바일은 구버전이 오래 남기 때문에 하위 호환이 중요한 이유

**AI 검증**

- [ ] 응답 모양이 엔드포인트마다 다르지 않은가

### 6-4. 커서 기반 페이지네이션

**Top-down**

- [ ] `?cursor=&limit=` → `{ items, nextCursor }`

**Bottom-up**

- [ ] Offset의 문제: 깊은 페이지 성능, 삽입 시 중복·누락
- [ ] Keyset: `(created_at, id) < ($1, $2)` 튜플 비교
- [ ] 정렬 키와 일치하는 복합 인덱스
- [ ] 불투명 커서 인코딩 (base64)
- [ ] `limit + 1` 조회로 다음 페이지 판단

**AI 검증**

- [ ] `created_at` 하나로만 커서를 만들지 않았는가

### 6-5. 백그라운드 작업 (크론, BullMQ)

**Top-down**

- [ ] `@nestjs/schedule` 크론
- [ ] `@nestjs/bullmq` + Redis 큐
- [ ] 메일·푸시·썸네일·탈퇴 만료·토큰 정리 작업 연결

**Bottom-up**

- [ ] 동기와 비동기 처리의 기준
- [ ] 재시도 + 지수 백오프, Dead letter
- [ ] at-least-once 전달과 멱등성
- [ ] 다중 인스턴스 크론 중복 실행 → 분산 락 또는 반복 작업
- [ ] Graceful shutdown

**AI 검증**

- [ ] 인스턴스가 늘면 크론이 N번 실행되지 않는가

### 6-6. (선택) 실시간 기능

**Top-down**

- [ ] `@nestjs/websockets` + Socket.IO
- [ ] Room 기반 채팅

**Bottom-up**

- [ ] HTTP Upgrade 과정, Polling / SSE와 비교
- [ ] 핸드셰이크 시점 인증과 토큰 만료 처리
- [ ] 하트비트, 재연결 시 누락 메시지 복구와 순서 보장
- [ ] 수평 확장: Redis Adapter (Pub/Sub)
- [ ] 영속화는 DB, 전달은 소켓

**AI 검증**

- [ ] 단일 인스턴스에서만 동작하는 구조가 아닌가

---

## 7. 진행 순서

- [ ] **1단계** — 0-1 공통 기반 (요청 생명주기만 Bottom-up)
- [ ] **2단계** — 🎯 1-1 이메일 가입/로그인 + 1-2 JWT (Bottom-up 완주)
- [ ] **3단계** — 1-8 권한, 6-3 에러 포맷, 6-2 로깅
- [ ] **4단계** — 1-5 이메일 인증/재설정, 3-2 이메일 발송, 6-5 큐
- [ ] **5단계** — 1-7 세션 관리, 1-3 소셜 로그인, 1-4 계정 연동
- [ ] **6단계** — 2-1 프로필, 2-2 이미지 업로드, 6-4 페이지네이션
- [ ] **7단계** — 3-1 푸시, 3-3 알림함, 6-1 Rate Limiting
- [ ] **8단계** — 4 결제·구독 (서명 검증·멱등성·상태 머신 Bottom-up)
- [ ] **9단계** — 1-6 탈퇴, 5 앱 운영
- [ ] **10단계** — 6-6 실시간 (선택)

---

## 8. 항목 완료 기준

각 항목을 끝낼 때마다 확인:

- [ ] AI 없이 요청부터 응답까지의 흐름을 그림으로 그릴 수 있다
- [ ] 공격 시나리오 2개 이상과 방어 코드를 짚을 수 있다
- [ ] 라이브러리가 내부에서 무엇을 대신해주는지 설명할 수 있다
- [ ] 인스턴스가 2대 이상일 때 깨지는 지점을 판단할 수 있다
- [ ] AI가 생성한 코드의 틀린 부분이나 구식 API를 지적할 수 있다
- [ ] 핵심 로직에 대한 테스트(단위 또는 e2e)가 있다
