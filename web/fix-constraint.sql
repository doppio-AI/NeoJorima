ALTER TABLE usuario DROP CONSTRAINT usuario_tipo_usuario_check;
ALTER TABLE usuario ADD CONSTRAINT usuario_tipo_usuario_check CHECK (tipo_usuario IN (1, 2, 3));
