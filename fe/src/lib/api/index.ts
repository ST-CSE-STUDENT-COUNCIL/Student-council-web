/**
 * API 모듈 통합 export
 * 
 * 사용 예시:
 * import { postApi, activityApi, welfareApi } from '@/lib/api'
 */

export { api } from '../axios'

// Auth
export { authApi } from './auth'

// Core APIs
export { postApi } from './notices'
export { activityApi } from './activities'
export { suggestionApi } from './suggestions'
export { welfareApi } from './welfare'
export { clubApi } from './clubs'
export { mypageApi } from './mypage'
