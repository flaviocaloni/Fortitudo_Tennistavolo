-- Aggiunge impostazione per abilitare/disabilitare Google OAuth
INSERT INTO app_settings (key, value) VALUES ('google_oauth_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
