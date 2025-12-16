export const MOCK_NOTICES = [
    {
        id: 1,
        title: "2024학년도 2학기 기말고사 간식행사 안내",
        description: "시험기간 지친 학우 여러분을 위해 든든한 간식을 준비했습니다. 학생회비 납부자라면 누구나!",
        type: "행사",
        date: "2024-12-01",
        file: null
    },
    {
        id: 2,
        title: "제35대 컴퓨터공학과 학생회장 선거 공고",
        description: "2025학년도 컴퓨터공학과 학생회를 이끌어갈 회장단 선거를 다음과 같이 공고합니다.",
        type: "선거",
        date: "2024-11-20",
        file: "/files/election_notice.pdf"
    },
    {
        id: 3,
        title: "2학기 과방 사물함 신청 안내",
        description: "2학기 과방 사물함 신청을 받습니다. 선착순으로 배정되니 서둘러주세요.",
        type: "복지",
        date: "2024-11-15",
        file: null
    },
    {
        id: 4,
        title: "11월 정기 대표자회의 회의록 공개",
        description: "지난 11월 10일에 진행된 정기 대표자회의 결과 및 회의록을 공개합니다.",
        type: "대표자회의",
        date: "2024-11-12",
        file: "/files/meeting_minutes_nov.pdf"
    },
    {
        id: 5,
        title: "2024학년도 동계방학 근로장학생 모집",
        description: "학과 사무실에서 근무할 근로장학생을 모집합니다. 관심 있는 학우들의 많은 지원 바랍니다.",
        type: "학과소식",
        date: "2024-11-10",
        file: null
    },
    {
        id: 6,
        title: "컴퓨터공학과 학생회칙 개정안 공고",
        description: "학생회칙 일부 개정안을 발의하며, 이에 대한 학우 여러분의 의견을 수렴합니다.",
        type: "학생회칙",
        date: "2024-11-05",
        file: "/files/rules_revision.pdf"
    },
    {
        id: 7,
        title: "10월 결산 공고",
        description: "2024년 10월 학생회비 사용 내역 및 결산안을 공고합니다.",
        type: "고시",
        date: "2024-11-01",
        file: "/files/financial_report_oct.pdf"
    },
    {
        id: 8,
        title: "졸업작품 전시회 'PIONEER' 개최 안내",
        description: "4학년 선배님들의 노력이 담긴 졸업작품 전시회에 여러분을 초대합니다.",
        type: "행사",
        date: "2024-10-25",
        file: null
    }
];

export const MOCK_EVENTS = [
    {
        id: 1,
        title: "2학기 기말고사 간식행사",
        description: "시험공부에 지친 학우들을 위한 햄버거 세트 증정!",
        image: "🍔",
        status: "planned",
        date: "2024.12.05 (목) 18:00"
    },
    {
        id: 2,
        title: "2024 컴퓨터공학과 해커톤",
        description: "무박 2일간 펼쳐지는 코딩 축제! 총 상금 200만원에 도전하세요.",
        image: "💻",
        status: "completed",
        date: "2024.11.22 (금) ~ 11.23 (토)"
    },
    {
        id: 3,
        title: "가을 체육대회",
        description: "선후배가 하나되는 체육대회! 축구, 농구, 피구 등 다양한 종목 진행.",
        image: "🏃",
        status: "completed",
        date: "2024.10.04 (금)"
    },
    {
        id: 4,
        title: "개강총회 및 뒤풀이",
        description: "2학기 개강을 맞아 진행되는 총회 및 뒤풀이 행사입니다.",
        image: "🍺",
        status: "completed",
        date: "2024.09.04 (수) 18:00"
    },
    {
        id: 5,
        title: "신입생 환영회",
        description: "25학번 신입생 여러분을 환영합니다!",
        image: "🎉",
        status: "wip",
        date: "2025.02.20 (목)"
    }
];

export const MOCK_MY_EVENTS = [
    {
        id: 1,
        title: "2학기 기말고사 간식행사",
        date: "2024.12.05",
        image: "🍔",
        status: "참여확정"
    },
    {
        id: 2,
        title: "2024 컴퓨터공학과 해커톤",
        date: "2024.11.22",
        image: "💻",
        status: "대기중"
    }
];

export const MOCK_PAST_EVENTS = [
    {
        id: 101,
        title: "2024 새내기 배움터",
        date: "2024.02.20",
        image: "🚌"
    },
    {
        id: 102,
        title: "2024 대동제 주점",
        date: "2024.05.15",
        image: "🎪"
    }
];

export const MOCK_BOOKMARKS = [
    {
        id: 1,
        title: "장학금 지급 규정 안내",
        category: "복지",
        date: "2024-11-01"
    },
    {
        id: 2,
        title: "2025학년도 학생회비 예산안",
        category: "학생회칙",
        date: "2024-10-15"
    },
    {
        id: 3,
        title: "졸업요건 변경 안내",
        category: "공고",
        date: "2024-09-20"
    }
];

export const MOCK_CLUBS = [
    {
        id: 1,
        name: "Tools",
        category: "학술",
        description: "프로젝트 위주의 활동을 하며 협업 경험을 쌓는 동아리입니다.",
        image: "🛠️",
        tags: ["프로젝트", "협업", "개발"],
        meetingTime: "매주 화요일 18:00"
    },
    {
        id: 2,
        name: "다락방",
        category: "학술",
        description: "다양한 분야의 스터디를 위주로 활동하는 학술 동아리입니다.",
        image: "📚",
        tags: ["스터디", "자기계발", "지식공유"],
        meetingTime: "매주 수요일 19:00"
    },
    {
        id: 3,
        name: "TCP",
        category: "학술",
        description: "정보보안 및 해킹 기술을 연구하고 학습하는 동아리입니다.",
        image: "🛡️",
        tags: ["보안", "해킹", "네트워크"],
        meetingTime: "매주 목요일 18:30"
    },
    {
        id: 4,
        name: "NL",
        category: "학술",
        description: "자연어 처리 및 인공지능 분야를 깊이 있게 연구하는 학술 동아리입니다.",
        image: "🧠",
        tags: ["AI", "NLP", "논문리뷰"],
        meetingTime: "매주 금요일 17:00"
    },
    {
        id: 5,
        name: "EC",
        category: "학술",
        description: "전공 심화 학습 및 다양한 학술 스터디를 진행합니다.",
        image: "🎓",
        tags: ["전공심화", "스터디", "학술"],
        meetingTime: "매주 월요일 19:00"
    },
    {
        id: 6,
        name: "PLUM",
        category: "학술",
        description: "언리얼 엔진을 활용한 게임 개발 및 프로젝트 진행 동아리입니다.",
        image: "🎮",
        tags: ["게임개발", "언리얼엔진", "프로젝트"],
        meetingTime: "매주 목요일 19:00"
    },
    {
        id: 7,
        name: "A.F.K",
        category: "스포츠",
        description: "컴퓨터공학과 축구 동아리입니다. 함께 땀 흘리며 친목을 다집니다.",
        image: "⚽",
        tags: ["축구", "친목", "스포츠"],
        meetingTime: "매주 금요일 16:00"
    }
];
