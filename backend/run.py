#!/usr/bin/env python3
"""
FastAPI 서버 실행 스크립트
간단하게 `python run.py` 또는 `./run.py`로 실행 가능
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 자동 재시작
        log_level="info"
    )
