# Cursor 규칙 설정 (counselapp)

이 저장소에서 Cursor가 따라야 할 규칙 구성입니다.

## 파일 역할

| 파일 | 용도 |
|------|------|
| **`CURSOR.mdc`** | Cursor가 **항상 읽는** 에이전트 규칙 (`alwaysApply: true`) |
| **`project.mdc`** | 프로젝트 사실(저장소, 스택, 주요 페이지) |
| **`CLAUDE.md`** | 코딩 실수를 줄이기 위한 **행동 가이드** 원문 (다운로드·참고용) |

에이전트는 **`CURSOR.mdc` + `project.mdc`** 를 기준으로 동작합니다. `CLAUDE.md`와 `CURSOR.mdc`는 같은 원칙(생각 → 단순함 → 최소 변경 → 검증)을 공유합니다.

## CLAUDE.md 요약 (4가지)

1. **Think before coding** — 추측 금지, 불명확하면 질문  
2. **Simplicity first** — 요청 범위만, 과한 추상화 금지  
3. **Surgical changes** — 관련 없는 코드 건드리지 않기  
4. **Goal-driven execution** — 단계마다 어떻게 확인할지 명시  

## counselapp에만 추가한 내용 (`CURSOR.mdc`)

- `lessons` 시간은 `VARCHAR`, 보강 `actual_lessons` 시간은 `TIME` → SQL에서 타입 섞지 않기  
- `api/*.js` 수정 후 로컬 서버 **재시작** 필요 (`server.js`가 핸들러를 캐시)  
- 보강 API·겹침 검사(취소 슬롯 제외)  
- commit은 사용자 요청 시에만  

## 규칙 수정 방법

- 행동·실수 방지: **`CURSOR.mdc`** 편집  
- 프로젝트 설명·경로: **`project.mdc`** 편집  
- 원칙 문서만 갱신: **`CLAUDE.md`** 편집 후 필요 시 `CURSOR.mdc`에 반영  

`.mdc` frontmatter의 `alwaysApply: true`를 유지해야 Cursor가 매 세션에 규칙을 적용합니다.
