/**
 * 모든 타입 정의 통합 export
 * 
 * 사용 예시:
 * import type { Activity, NoticeListItem, User } from '@/types'
 */

// Activities
export type {
    Activity,
    ActivityListItem,
    ActivityStatus,
    ActivityType,
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityListResponse,
    ActivityCreateRequest,
    ActivityUpdateRequest,
    FormField,
    SurveySubmitRequest,
} from './activities'

export { getActivityStatus, activityTypeLabels } from './activities'

// Posts & Notices
export type {
    BoardInfo,
    AuthorInfo,
    AttachmentInfo,
    AttachmentFileInfo,
    NoticeListItem,
    NoticeDetailResponse,
    PaginationMeta,
    NoticeListResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest,
    Post,
} from './posts'

// Suggestions
export type {
    Suggestion,
    SuggestionListItem,
    SuggestionListResponse,
} from './suggestions'

// Users
export type {
    User,
    LoginResponse,
    SignupResponse,
    VerifyEmailResponse,
    CheckStudentIdResponse,
    UserListItem,
    PendingUserItem,
} from './users'

// Clubs
export type {
    Club,
} from './clubs'

// Boards
export type {
    Board,
} from './boards'


