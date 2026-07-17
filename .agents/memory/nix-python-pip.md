---
name: NixOS Python pip
description: How to install and use Python packages in a Replit NixOS monorepo workspace.
---

## Rules

1. Use `installProgrammingLanguage({ language: "python-3.11" })` to bootstrap Python with pip.
2. Python binary ends up at `/home/runner/workspace/.pythonlibs/bin/python3`.
3. Packages land in `/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages/`.
4. Direct `pip install` fails with "externally-managed-environment" — do NOT use it in shell scripts.
5. `installLanguagePackages` may also fail if a package needs to write to nix store.
6. For shell startup scripts, set PYTHONPATH explicitly and skip pip install (packages already installed by step 1).

**Why:** NixOS immutable store blocks pip writes; installProgrammingLanguage uses uv into .pythonlibs which IS writable.
