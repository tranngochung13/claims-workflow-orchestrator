ALTER TABLE claims ADD COLUMN information_request_count INTEGER NOT NULL DEFAULT 0 CHECK(information_request_count BETWEEN 0 AND 3);
    CREATE TABLE transition_events (
      id TEXT PRIMARY KEY NOT NULL,
      claim_id TEXT NOT NULL REFERENCES claims(id),
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL CHECK(actor_role IN ('claimant', 'adjuster')),
      transition_id TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      previous_revision INTEGER NOT NULL CHECK(previous_revision >= 0),
      resulting_revision INTEGER NOT NULL CHECK(resulting_revision = previous_revision + 1),
      input_json TEXT NOT NULL CHECK(json_valid(input_json)),
      created_at TEXT NOT NULL,
      UNIQUE(claim_id, resulting_revision)
    ) STRICT;
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL REFERENCES transition_events(id),
      effect_index INTEGER NOT NULL CHECK(effect_index >= 0),
      recipient_actor_id TEXT NOT NULL,
      template TEXT NOT NULL CHECK(template IN ('information_requested', 'claim_approved', 'claim_rejected')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(event_id, effect_index)
    ) STRICT;
    CREATE TABLE command_receipts (
      command_id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL UNIQUE REFERENCES transition_events(id),
      fingerprint TEXT NOT NULL CHECK(length(fingerprint) = 64),
      result_json TEXT NOT NULL CHECK(json_valid(result_json))
    ) STRICT;
    CREATE TRIGGER transition_events_no_update BEFORE UPDATE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
    CREATE TRIGGER transition_events_no_delete BEFORE DELETE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
    CREATE TRIGGER notifications_no_update BEFORE UPDATE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
    CREATE TRIGGER notifications_no_delete BEFORE DELETE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
    CREATE TRIGGER command_receipts_no_update BEFORE UPDATE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;
    CREATE TRIGGER command_receipts_no_delete BEFORE DELETE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;