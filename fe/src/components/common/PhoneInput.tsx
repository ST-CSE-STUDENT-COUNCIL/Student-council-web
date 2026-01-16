import { useState, useEffect, useRef } from 'react'
import { Phone, Check } from 'lucide-react'

type PhoneInputProps = {
    value: string
    onChange: (value: string) => void
    name?: string
    required?: boolean
    placeholder?: string
    className?: string
    showValidation?: boolean
    autoFocus?: boolean
}

// 전화번호 포맷팅 함수: 숫자만 추출 후 010-XXXX-XXXX 형식으로 변환
const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '')

    // 최대 11자리까지만 허용
    const limited = numbers.slice(0, 11)

    // 포맷팅
    if (limited.length <= 3) {
        return limited
    } else if (limited.length <= 7) {
        return `${limited.slice(0, 3)}-${limited.slice(3)}`
    } else {
        return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`
    }
}

// 전화번호 유효성 검사: 010-XXXX-XXXX 형식이고 11자리인지 확인
const isValidPhoneNumber = (value: string): boolean => {
    const numbers = value.replace(/\D/g, '')
    return numbers.length === 11 && numbers.startsWith('010')
}

export const PhoneInput = ({
    value,
    onChange,
    name = 'phone',
    required = false,
    placeholder = '010-0000-0000',
    className = '',
    showValidation = true,
    autoFocus = false
}: PhoneInputProps) => {
    const [isFocused, setIsFocused] = useState(false)
    const [displayValue, setDisplayValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // 외부 value가 변경되면 display value 업데이트
    useEffect(() => {
        setDisplayValue(formatPhoneNumber(value))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        const formatted = formatPhoneNumber(inputValue)
        setDisplayValue(formatted)

        // 순수 숫자 값을 부모에게 전달 (하이픈 제거)
        const rawNumbers = formatted.replace(/-/g, '')
        onChange(rawNumbers)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // 백스페이스 시 하이픈 자동 처리
        if (e.key === 'Backspace') {
            const cursorPos = inputRef.current?.selectionStart || 0
            // 커서가 하이픈 바로 뒤에 있으면 하이픈도 함께 삭제되도록 처리
            if (displayValue[cursorPos - 1] === '-') {
                e.preventDefault()
                const newValue = displayValue.slice(0, cursorPos - 2) + displayValue.slice(cursorPos)
                const formatted = formatPhoneNumber(newValue)
                setDisplayValue(formatted)
                onChange(formatted.replace(/-/g, ''))
            }
        }
    }

    const isValid = isValidPhoneNumber(displayValue)
    const hasValue = displayValue.length > 0
    const showStatus = showValidation && hasValue && !isFocused && isValid

    return (
        <div className={`relative ${className}`}>
            {/* 전화번호 아이콘 */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone
                    size={18}
                    className={`transition-colors duration-200 ${isFocused ? 'text-blue-500' : 'text-gray-400'
                        }`}
                />
            </div>

            {/* 입력 필드 */}
            <input
                ref={inputRef}
                type="tel"
                name={name}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required={required}
                placeholder={placeholder}
                autoFocus={autoFocus}
                autoComplete="tel"
                inputMode="numeric"
                className={`
                    w-full pl-11 pr-10 py-3 
                    border rounded-xl 
                    text-gray-900 placeholder-gray-400 
                    transition-all duration-200
                    focus:outline-none focus:ring-2
                    ${isFocused
                        ? 'border-blue-500 ring-blue-200 bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }
                `}
            />

            {/* 완료 체크 아이콘 (유효할 때만 표시) */}
            {showStatus && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check size={18} className="text-gray-400" />
                </div>
            )}

            {/* 포커스 시 힌트 메시지 */}
            {isFocused && (
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500 animate-fade-in">
                    숫자만 입력하면 자동으로 형식이 적용됩니다
                </div>
            )}
        </div>
    )
}
