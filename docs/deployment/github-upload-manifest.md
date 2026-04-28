# GitHub upload manifest

Repositorio destino: `FileLanderScaner/CODEX`.

Rama creada por conector: `codex/production-readiness-ahorroya`.

Commit ya subido:

- `81bf9377875e5ccbb1790cd7fe9f58efc7761ccf`: agrega `docs/audit/remaining-work-to-finish.md`.

## Bloqueo de subida completa desde este entorno

El workspace local no tiene:

- `.git`
- binario `git`
- binario `gh`

El conector GitHub puede crear ramas, commits y archivos, pero no puede leer automaticamente archivos locales. El cambio completo contiene 110 archivos nuevos/modificados, por lo que subirlos todos por conector implicaria reenviar manualmente el contenido de cada archivo.

## Paquete preparado

Se genero:

```text
C:\codex\ahorroya-production-ready-upload.zip
```

Contenido excluido del paquete:

- `node_modules/`
- `dist/`
- `.vercel/`
- `.expo/`
- `test-results/`
- `stitch/`

## Comando recomendado en una maquina con Git

```powershell
git clone https://github.com/FileLanderScaner/CODEX.git
cd CODEX
git checkout -b codex/production-readiness-ahorroya
# extraer ahorroya-production-ready-upload.zip encima del repo
git add -A
git commit -m "feat: prepare AhorroYA for production readiness"
git push -u origin codex/production-readiness-ahorroya
```

Luego abrir PR hacia `main`.
