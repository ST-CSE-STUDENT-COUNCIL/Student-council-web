export interface Event {
    id: number;
    title: string;
    status: 'active' | 'closed' | 'scheduled';
    category?: 'register' | 'survey' | 'kakao' | 'notice' | 'payment';
    externalUrl?: string;
    description: string;
    image: string;
    images?: string[];
    currentCount: number;
    maxCount: number;
    isPinned?: boolean;
}