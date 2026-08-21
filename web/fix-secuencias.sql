-- Resincroniza las secuencias autoincrementales con el ID máximo real
-- que ya existe en cada tabla. Sin esto, Postgres sigue intentando
-- usar IDs que ya están ocupados.
SELECT setval(pg_get_serial_sequence('edificio', 'edificio_id'), COALESCE((SELECT MAX(edificio_id) FROM edificio), 1));
SELECT setval(pg_get_serial_sequence('usuario', 'usuario_id'), COALESCE((SELECT MAX(usuario_id) FROM usuario), 1));
