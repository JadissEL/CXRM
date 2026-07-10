-- Privacy Audit Table for GDPR Compliance
-- This table logs all privacy-related actions for audit purposes

CREATE TABLE IF NOT EXISTS privacy_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  action_type TEXT NOT NULL CHECK (action_type IN ('data_export', 'account_deletion', 'data_request')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed')),
  request_ip INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context (file size, export format, etc.)
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying by user and action type
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user_id ON privacy_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_action_type ON privacy_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_created_at ON privacy_audit(created_at);

-- RLS policies for privacy audit table
ALTER TABLE privacy_audit ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit records
CREATE POLICY "Users can view own privacy audit records" ON privacy_audit
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- Only system/API can insert audit records (no direct user access)
CREATE POLICY "System can insert privacy audit records" ON privacy_audit
  FOR INSERT WITH CHECK (true);

-- Only system can update audit records
CREATE POLICY "System can update privacy audit records" ON privacy_audit
  FOR UPDATE USING (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_privacy_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER privacy_audit_updated_at
  BEFORE UPDATE ON privacy_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_audit_updated_at();

-- Function to cascade delete user data (called during account deletion)
CREATE OR REPLACE FUNCTION cascade_delete_user_data(target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  deletion_count INTEGER := 0;
BEGIN
  -- Delete from profiles table
  DELETE FROM profiles WHERE clerk_user_id = target_user_id;
  GET DIAGNOSTICS deletion_count = ROW_COUNT;
  
  -- Add more cascade deletions here as your schema grows
  -- Example:
  -- DELETE FROM bookings WHERE user_id = target_user_id;
  -- DELETE FROM reviews WHERE user_id = target_user_id;
  -- DELETE FROM messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  
  -- Log the deletion in privacy audit
  INSERT INTO privacy_audit (user_id, action_type, status, metadata)
  VALUES (
    target_user_id,
    'account_deletion',
    'completed',
    jsonb_build_object('deleted_records', deletion_count, 'timestamp', NOW())
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the failure
    INSERT INTO privacy_audit (user_id, action_type, status, error_message)
    VALUES (
      target_user_id,
      'account_deletion',
      'failed',
      SQLERRM
    );
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cascade_delete_user_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_privacy_audit_updated_at() TO authenticated;