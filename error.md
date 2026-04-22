{
  "event_message": "function extensions.http_post(url => text, body => jsonb, headers => jsonb) does not exist",
  "id": "73a9fb9f-74f4-4a6a-8638-e769f22950a2",
  "metadata": [
    {
      "file": null,
      "host": "db-eewywjfdwkzhsnzvycip",
      "metadata": [],
      "parsed": [
        {
          "application_name": null,
          "backend_type": "client backend",
          "command_tag": "INSERT",
          "connection_from": "127.0.0.1:17919",
          "context": "PL/pgSQL function public.notify_auth_user_created() line 39 at PERFORM",
          "database_name": "postgres",
          "detail": null,
          "error_severity": "ERROR",
          "hint": "No function matches the given name and argument types. You might need to add explicit type casts.",
          "internal_query": "SELECT extensions.http_post(\r\n      url := webhook_url,\r\n      body := payload,\r\n      headers := jsonb_build_object(\r\n        'Content-Type', 'application/json',\r\n        'X-Webhook-Signature', signature\r\n      )\r\n    )",
          "internal_query_pos": 8,
          "leader_pid": null,
          "location": null,
          "process_id": 182924,
          "query": "INSERT INTO \"users\" (\"aud\", \"banned_until\", \"confirmation_sent_at\", \"confirmation_token\", \"created_at\", \"deleted_at\", \"email\", \"email_change\", \"email_change_confirm_status\", \"email_change_sent_at\", \"email_change_token_current\", \"email_change_token_new\", \"email_confirmed_at\", \"encrypted_password\", \"id\", \"instance_id\", \"invited_at\", \"is_anonymous\", \"is_sso_user\", \"last_sign_in_at\", \"phone\", \"phone_change\", \"phone_change_sent_at\", \"phone_change_token\", \"phone_confirmed_at\", \"raw_app_meta_data\", \"raw_user_meta_data\", \"reauthentication_sent_at\", \"reauthentication_token\", \"recovery_sent_at\", \"recovery_token\", \"role\", \"updated_at\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)",
          "query_id": -2115976027280758800,
          "query_pos": null,
          "session_id": "69e8e064.2ca8c",
          "session_line_num": 4,
          "session_start_time": "2026-04-22 14:51:16 UTC",
          "sql_state_code": "42883",
          "timestamp": "2026-04-22 14:51:16.993 UTC",
          "transaction_id": 2517,
          "user_name": "supabase_auth_admin",
          "virtual_transaction_id": "19/3589"
        }
      ],
      "parsed_from": null,
      "project": null,
      "source_type": null
    }
  ],
  "timestamp": 1776869476993000
}