# Reglas Git Multiagente (Commit, Push, Merge)

Fecha: 31 Mar 2026  
Base branch del workspace: `main`

## 1) Objetivo
Tener un flujo único para que varios agentes trabajen en paralelo sin pisarse cambios ni romper `main`.

## 2) Reglas de ramas
- Nunca trabajar directo sobre `main`.
- Una tarea = una rama.
- Nombre recomendado: `MatiasDW/<area>-<tarea-corta>`.
- Si una tarea crece demasiado, dividir en 2 ramas.
- No reutilizar ramas viejas para tareas nuevas.

## 3) Reglas de commit
- Commits pequeños, atómicos y reversibles.
- Mensaje en formato: `<tipo>(<scope>): <resumen>`.
- Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Incluir contexto mínimo en el cuerpo cuando aplique: qué cambia y por qué.
- No mezclar cambios no relacionados en un mismo commit.

Ejemplos:
- `feat(pichanga): agregar comando me sumo`
- `fix(payments): corregir recalculo de deuda al bajar jugador`
- `docs(git): definir protocolo multiagente`

## 4) Reglas de push
- Hacer `push` frecuente para no perder trabajo.
- Usar `git push -u origin <rama>` en el primer push.
- Después usar `git push`.
- No usar `--force` en ramas compartidas.
- `--force-with-lease` solo si es imprescindible y avisado al equipo.

## 5) Reglas de sincronización con main
- Antes de abrir PR: actualizar rama con `main`.
- Estrategia recomendada: `rebase` para historial limpio.
- Si hay conflictos, resolver en la rama y volver a correr checks.

Secuencia:
```bash
git fetch origin
git rebase origin/main
# resolver conflictos
git push --force-with-lease   # solo en tu propia rama
```

## 6) Reglas de merge
- Merge a `main` solo vía PR.
- Condiciones mínimas de merge:
1. Build/tests en verde (si existen).
2. Al menos una revisión (humana o agente responsable).
3. Sin conflictos pendientes.
- Preferencia de estrategia: `Squash and merge` para mantener `main` limpio.
- Título del PR debe describir resultado funcional, no solo cambio técnico.

## 7) Coordinación entre agentes
- Cada agente deja estado en `.context/handoffs/<rama>.md`.
- Handoff mínimo:
1. Qué hizo.
2. Qué falta.
3. Riesgos abiertos.
4. Archivos tocados.
- Si detectas cambios inesperados fuera de tu scope, pausar y avisar antes de continuar.

Plantilla sugerida:
```md
# Handoff - <rama>
## Hecho
- ...
## Pendiente
- ...
## Riesgos
- ...
## Archivos tocados
- ...
```

## 8) Reglas de seguridad
- Prohibido `git reset --hard` en trabajo compartido.
- Prohibido `git checkout -- <archivo>` para borrar cambios ajenos sin acuerdo.
- No hacer `amend` de commits ya publicados sin coordinación.

## 9) Checklist rápido antes de PR
1. Rama actualizada con `origin/main`.
2. Commits limpios y con mensaje claro.
3. Sin cambios debug temporales.
4. Tests o validaciones ejecutadas.
5. Handoff actualizado en `.context/handoffs/`.

## 10) Convención mínima de PR
- Título: `[<area>] <resultado>`.
- Descripción con:
1. Contexto.
2. Cambios principales.
3. Cómo probar.
4. Riesgos/rollback.
