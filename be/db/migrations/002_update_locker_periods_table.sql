-- ============================================================================
-- Locker Periods 테이블에 반납 기간 필드 추가
-- ============================================================================

-- 기존 테이블 삭제 후 재생성 (데이터 손실 주의!)
DROP TABLE IF EXISTS locker_rentals CASCADE;
DROP TABLE IF EXISTS locker_periods CASCADE;

-- 새 구조로 locker_periods 테이블 생성
CREATE TABLE locker_periods (
  id SERIAL PRIMARY KEY,
  period_name VARCHAR(50) NOT NULL,  -- '2025-1학기', '2025-여름방학', '2025-2학기', '2025-겨울방학'
  
  -- 신청 기간 (학기 초)
  application_start TIMESTAMPTZ NOT NULL,  -- 신청 시작
  application_end TIMESTAMPTZ NOT NULL,    -- 신청 마감
  
  -- 사용 기간 (개강~종강)
  usage_start DATE NOT NULL,  -- 사용 시작 (개강일)
  usage_end DATE NOT NULL,    -- 사용 종료 (종강일)
  
  -- 반납 기간 (종강 즈음)
  return_start TIMESTAMPTZ NOT NULL,  -- 반납 시작 (예: 종강 1주 전)
  return_end TIMESTAMPTZ NOT NULL,    -- 반납 마감 (예: 종강 후 1주)
  
  is_active BOOLEAN DEFAULT true,  -- 현재 활성화된 기간인지
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE locker_periods IS '[관리자 전용] 사물함 대여 기간 설정 (신청/사용/반납 기간 관리)';
COMMENT ON COLUMN locker_periods.is_active IS '현재 활성화된 기간 (하나만 true)';
COMMENT ON COLUMN locker_periods.application_start IS '신청 시작 시각 (학기 초)';
COMMENT ON COLUMN locker_periods.application_end IS '신청 마감 시각 (학기 초)';
COMMENT ON COLUMN locker_periods.return_start IS '반납 시작 시각 (종강 즈음)';
COMMENT ON COLUMN locker_periods.return_end IS '반납 마감 시각 (종강 후)';

CREATE INDEX idx_locker_periods_is_active ON locker_periods(is_active);

-- locker_rentals 테이블 재생성 (의존성 때문)
CREATE TABLE locker_rentals (
  id SERIAL PRIMARY KEY,
  locker_number INT REFERENCES welfare_lockers(locker_number),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_id INT REFERENCES locker_periods(id) ON DELETE CASCADE,
  
  -- 상태
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, in_use, returned, expired
  
  -- 승인 정보
  approved_by UUID REFERENCES users(id),  -- 승인한 관리자
  approved_at TIMESTAMPTZ,
  
  -- 반납 확인 정보
  return_confirmed_by UUID REFERENCES users(id),  -- 비움 확인한 관리자
  return_confirmed_at TIMESTAMPTZ,
  
  notes TEXT,  -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 같은 기간에 같은 사물함은 한 명만
  UNIQUE(locker_number, period_id)
);

COMMENT ON TABLE locker_rentals IS '[인증 필요] 사물함 대여 신청 및 내역';
COMMENT ON COLUMN locker_rentals.status IS 'pending: 신청대기, approved: 승인됨, in_use: 사용중, returned: 반납완료, expired: 기간만료';
COMMENT ON COLUMN locker_rentals.return_confirmed_by IS '사물함 비움을 확인한 관리자';

CREATE INDEX idx_locker_rentals_user_id ON locker_rentals(user_id);
CREATE INDEX idx_locker_rentals_period_id ON locker_rentals(period_id);
CREATE INDEX idx_locker_rentals_status ON locker_rentals(status);
