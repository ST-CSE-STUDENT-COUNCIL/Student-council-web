#!/bin/bash
# Fly.io 환경변수 설정 스크립트
# 사용법: ./set_fly_secrets.sh

set -e

echo "🚀 Fly.io 환경변수 설정 시작..."

# .env 파일 존재 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일을 찾을 수 없습니다."
    exit 1
fi

# 임시 파일 생성
TEMP_FILE=$(mktemp)

# .env 파일에서 환경변수 추출 (빈 줄, 주석 제외)
while IFS= read -r line || [ -n "$line" ]; do
    # 빈 줄, 주석 무시
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # KEY=VALUE 형식 추출
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        KEY="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        
        # 따옴표 제거 (있으면)
        VALUE="${VALUE#\"}"
        VALUE="${VALUE%\"}"
        VALUE="${VALUE#\'}"
        VALUE="${VALUE%\'}"
        
        echo "$KEY=$VALUE" >> "$TEMP_FILE"
        echo "  ✓ $KEY"
    fi
done < .env

echo ""
echo "⏳ fly secrets set 실행 중..."

# fly secrets import 사용 (공백 처리 용이)
fly secrets import < "$TEMP_FILE"

# 임시 파일 삭제
rm -f "$TEMP_FILE"

echo ""
echo "✅ 환경변수 설정 완료!"
