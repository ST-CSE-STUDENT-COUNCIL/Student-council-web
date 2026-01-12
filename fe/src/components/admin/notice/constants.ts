export const CATEGORIES = [
    { label: '학생회', value: 'student_council', boardId: 1 },
    { label: '민주자치', value: 'democracy', boardId: 2 },
]

// Sub-categories per board
export const BOARD_SUB_CATEGORIES: Record<string, { label: string, value: string }[]> = {
    student_council: [
        { label: '공지', value: '공지' },
        { label: '행사', value: '행사' },
        { label: '복지', value: '복지' },
    ],
    democracy: [
        { label: '공고', value: '공고' },
        { label: '고시', value: '고시' },
        { label: '대표자회의', value: '대표자회의' },
        { label: '학생회칙', value: '학생회칙' },
    ]
}

export const ALL_SUB_CATEGORIES = [
    ...BOARD_SUB_CATEGORIES.student_council,
    ...BOARD_SUB_CATEGORIES.democracy
]


export const subMapReverse: Record<string, string> = {
    'event': '행사',
    'welfare': '복지',
    'announcement': '공고',
    'notice': '고시',
    'meeting': '대표자회의',
    'rules': '학생회칙'
}
