"""
로깅 설정 유틸리티
"""
import logging
import sys
from typing import Optional

def setup_logger(name: Optional[str] = None) -> logging.Logger:
    """
    로거 설정 및 반환
    
    Args:
        name: 로거 이름 (None이면 root logger)
    
    Returns:
        설정된 Logger 인스턴스
    """
    logger = logging.getLogger(name)
    
    # 이미 핸들러가 설정되어 있으면 중복 설정 방지
    if logger.handlers:
        return logger
    
    # 로그 레벨 설정 (환경변수로 조정 가능)
    import os
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # 콘솔 핸들러 설정
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    
    # 포맷 설정 (구조화된 로그)
    formatter = logging.Formatter(
        '[%(levelname)s] %(asctime)s - %(name)s:%(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # 핸들러 추가
    logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    로거 가져오기 (간편 함수)
    
    Args:
        name: 로거 이름 (보통 __name__ 사용)
    
    Returns:
        Logger 인스턴스
    """
    return setup_logger(name)
