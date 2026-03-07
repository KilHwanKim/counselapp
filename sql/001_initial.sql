-- 상담 앱 초기 테이블 예시 (재실행 시 에러 방지를 위해 IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS counsel_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
