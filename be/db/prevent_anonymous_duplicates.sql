-- [Migration] Prevent Anonymous Duplicate Registrations (Robust Version)

-- 0. Remove Existing Duplicates (Cleaning Step)
-- Before adding a Unique Index, we MUST remove existing duplicates.
-- We keep the EARLIEST registration (min id) and delete later ones.

-- 0-1. Remove duplicate Student IDs for same activity
DELETE FROM activity_registrations a
WHERE a.created_at > (
    SELECT MIN(b.created_at)
    FROM activity_registrations b
    WHERE a.activity_id = b.activity_id
    AND a.student_id = b.student_id
    AND b.student_id IS NOT NULL
    AND b.status != 'cancelled'
)
AND a.status != 'cancelled'
AND a.student_id IS NOT NULL;

-- 0-2. Remove duplicate Phones for same activity
DELETE FROM activity_registrations a
WHERE a.created_at > (
    SELECT MIN(b.created_at)
    FROM activity_registrations b
    WHERE a.activity_id = b.activity_id
    AND a.phone = b.phone
    AND b.phone IS NOT NULL
    AND b.status != 'cancelled'
)
AND a.status != 'cancelled'
AND a.phone IS NOT NULL;


-- 1. Add Unique Constraints
-- Now that data is clean, we can safely create Unique Indexes.
-- These indexes will prevent ANY future duplicates (from 'double clicks').

-- 1-1. Unique Student ID per Activity
DROP INDEX IF EXISTS idx_activity_registrations_unique_student;
CREATE UNIQUE INDEX idx_activity_registrations_unique_student 
ON activity_registrations(activity_id, student_id)
WHERE student_id IS NOT NULL AND status != 'cancelled';

-- 1-2. Unique Phone Number per Activity
DROP INDEX IF EXISTS idx_activity_registrations_unique_phone;
CREATE UNIQUE INDEX idx_activity_registrations_unique_phone
ON activity_registrations(activity_id, phone)
WHERE phone IS NOT NULL AND status != 'cancelled';
