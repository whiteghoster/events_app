-- Check the current constraint on audit_log table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'audit_log'::regclass AND contype = 'c';

-- If the constraint is too strict, you can modify it with:
-- First, drop the existing constraint (if needed)
-- ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;

-- Then add a new constraint with valid values
-- ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check 
-- CHECK (action IN ('create', 'update', 'delete', 'CREATE', 'UPDATE', 'DELETE'));

-- Or make it case-insensitive by only allowing lowercase:
-- ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check 
-- CHECK (action IN ('create', 'update', 'delete'));

-- Alternative: Check what actions currently exist in the table
SELECT DISTINCT action FROM audit_log;
