import { z } from 'zod'

/**
 * 회원가입 폼 스키마
 */
export const signupFormSchema = z.object({
    name: z.string()
        .min(1, '이름을 입력해주세요'),

    student_id: z.string()
        .min(8, '학번은 8자리 이상이어야 합니다')
        .max(15, '학번은 15자리 이하여야 합니다')
        .regex(/^\d+$/, '학번은 숫자만 입력해주세요'),

    email: z.string()
        .min(1, '이메일을 입력해주세요')
        .email('올바른 이메일 형식을 입력해주세요'),

    phone: z.string()
        .length(11, '전화번호를 정확히 입력해주세요')
        .regex(/^\d+$/, '전화번호는 숫자만 입력해주세요'),

    password: z.string()
        .min(8, '비밀번호는 8자 이상이어야 합니다')
        .regex(/[a-zA-Z]/, '영문을 포함해야 합니다')
        .regex(/\d/, '숫자를 포함해야 합니다')
        .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, '특수문자를 포함해야 합니다'),

    password_confirm: z.string()
        .min(1, '비밀번호 확인을 입력해주세요'),

    department: z.string()
        .min(1, '학과를 입력해주세요'),
}).refine((data) => data.password === data.password_confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['password_confirm'],
})

export type SignupFormData = z.infer<typeof signupFormSchema>

/**
 * 로그인 폼 스키마
 */
export const loginFormSchema = z.object({
    student_id: z.string()
        .length(8, '학번 8자리를 입력해주세요')
        .regex(/^\d+$/, '학번은 숫자만 입력해주세요'),

    password: z.string()
        .min(1, '비밀번호를 입력해주세요'),
})

export type LoginFormData = z.infer<typeof loginFormSchema>

/**
 * 비밀번호 재설정 스키마
 */
export const resetPasswordSchema = z.object({
    student_id: z.string()
        .length(8, '학번 8자리를 입력해주세요')
        .regex(/^\d+$/, '학번은 숫자만 입력해주세요'),

    newPassword: z.string()
        .min(8, '비밀번호는 8자 이상이어야 합니다')
        .regex(/[a-zA-Z]/, '영문을 포함해야 합니다')
        .regex(/\d/, '숫자를 포함해야 합니다')
        .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, '특수문자를 포함해야 합니다'),

    confirmPassword: z.string()
        .min(1, '비밀번호 확인을 입력해주세요'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
