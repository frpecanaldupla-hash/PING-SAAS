-- PING · migration 0010_appointment_notes
-- Área do Cliente vai permitir deixar uma observação livre ao agendar
-- (ex: "corte igual da última vez", "tenho pressa"). Sem coluna própria,
-- não tem onde guardar isso — appointments não tinha texto livre nenhum.
alter table appointments add column if not exists notes text;
