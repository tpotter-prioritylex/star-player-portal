DELETE FROM sop_competencies;

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM users WHERE role = 'star_player'
  LOOP
    INSERT INTO sop_competencies (user_id, sop_code, sop_title) VALUES
      (user_record.id, 'A-1', 'Voice Intake Processing'),
      (user_record.id, 'A-2', 'Matter Creation in Clio'),
      (user_record.id, 'A-3', 'AI-Powered Legal Research'),
      (user_record.id, 'A-4', 'Work Execution and Task Management'),
      (user_record.id, 'A-5', 'Daily Operations Dashboard'),
      (user_record.id, 'A-6', 'Client Communication Protocols'),
      (user_record.id, 'A-7', 'Document Management and Filing'),
      (user_record.id, 'A-8', 'Quality Control and Self-Review'),
      (user_record.id, 'B-1', 'Clio Manage Operations'),
      (user_record.id, 'B-2', 'Claude AI Usage and Prompt Engineering'),
      (user_record.id, 'B-4', 'Quo Operations'),
      (user_record.id, 'B-5', 'Legal Research with Midpage MCP'),
      (user_record.id, 'D-1', 'Asset Inventory Compilation'),
      (user_record.id, 'D-2', 'Creditor Notification and Tracking'),
      (user_record.id, 'D-3', 'Estate Accounting Production'),
      (user_record.id, 'D-4', 'Estate Case Intake and Lifecycle Management'),
      (user_record.id, 'F-1', 'Confidentiality and Data Handling'),
      (user_record.id, 'F-2', 'Ethical Boundaries and UPL Prevention'),
      (user_record.id, 'F-3', 'Attorney Review Submission Protocol'),
      (user_record.id, 'F-4', 'Incident Reporting and Escalation')
    ON CONFLICT (user_id, sop_code) DO NOTHING;
  END LOOP;
END $$;