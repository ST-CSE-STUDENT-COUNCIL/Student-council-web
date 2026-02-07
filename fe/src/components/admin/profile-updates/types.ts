export type UpdateField = 'name' | 'student_id'

export type ProfileUpdateRequest = {
  id: string
  requestIds: Array<string>
  name: string
  studentId: string
  updates: Array<{ field: UpdateField; newValue: string; currentValue: string }>
  requestedAt: string
  requestedAtRaw: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string
  verificationImageUrl: string
}

export type StatusFilter = 'pending' | 'approved' | 'rejected'
