# CLI command spec (`dude` / `dg`)

Package: `@dudgital/dude`  
Binaries: `dude`, `dg` (identical entrypoint). Everyday short form: **`dg`**.

## MVP subset (ship first)

| Command | Purpose |
|---------|---------|
| `dg --help` | Help |
| `dg detect` | Detect host framework |
| `dg add auth` | Install auth module (+ provider) |
| `dg doctor` | Validate install |

Flags (MVP): `--provider <id>`, `--yes`, `--dry-run`, `--cwd <path>`

## Full eventual surface

| Command | Wave |
|---------|------|
| `dg init` | N2+ |
| `dg add <module>` | N1+ |
| `dg update` | N2 |
| `dg login` / `dg link` | D0 |
| `dg secrets pull` / `push` | D0 |
| `dg providers` / `dg templates` | later |
| `dg sync` | D0+ |

## Automation contract for `add`

1. Detect framework  
2. Load module  
3. Resolve provider (prompt or flag)  
4. Compose task list via framework integration  
5. Run tasks (or print on `--dry-run`)  
6. Run doctor checks  
7. Print next steps  

The CLI never embeds Laravel- or Next-specific install logic.
