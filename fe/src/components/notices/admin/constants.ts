export const CATEGORIES = [
    { label: '학생회', value: '1', boardId: 1 },
    { label: '민주자치', value: '2', boardId: 2 },
]

// Sub-categories per board
export const BOARD_SUB_CATEGORIES: Record<string, { label: string, value: string }[]> = {
    '1': [
        { label: '공지', value: 'notification' },
        { label: '행사', value: 'event' },
        { label: '복지', value: 'welfare' },
    ],
    '2': [
        { label: '공고', value: 'announcement' },
        { label: '고시', value: 'notice' },
        { label: '대표자회의', value: 'meeting' },
        { label: '학생회칙', value: 'rules' },
    ]
}

export const ALL_SUB_CATEGORIES = [
    ...BOARD_SUB_CATEGORIES['1'],
    ...BOARD_SUB_CATEGORIES['2']
]


export const subMapReverse: Record<string, string> = {
    'notification': '공지',
    'event': '행사',
    'welfare': '복지',
    'announcement': '공고',
    'notice': '고시',
    'meeting': '대표자회의',
    'rules': '학생회칙'
}
