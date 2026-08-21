#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/.agents/skills/ui-ux-pro-max"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

UPSTREAM_REPO="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git"

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 1; }

printf '%s\n' "Installing UI/UX Pro Max from upstream..."
git clone --depth 1 --filter=blob:none --sparse "$UPSTREAM_REPO" "$TMP_DIR/ui-ux-pro-max-skill" >/dev/null 2>&1

git -C "$TMP_DIR/ui-ux-pro-max-skill" sparse-checkout set src/ui-ux-pro-max

mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR/data" "$TARGET_DIR/scripts" "$TARGET_DIR/templates"
cp -R "$TMP_DIR/ui-ux-pro-max-skill/src/ui-ux-pro-max/data" "$TARGET_DIR/data"
cp -R "$TMP_DIR/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts" "$TARGET_DIR/scripts"
cp -R "$TMP_DIR/ui-ux-pro-max-skill/src/ui-ux-pro-max/templates" "$TARGET_DIR/templates"

# Keep the project-local skill manifest, which contains the Softwall-specific integration notes.
if [[ ! -f "$TARGET_DIR/SKILL.md" ]]; then
  cat > "$TARGET_DIR/SKILL.md" <<'EOF'
---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web, mobile, and desktop."
---

Use the bundled UI/UX Pro Max database and scripts for interface design and implementation guidance.
EOF
fi

printf '%s\n' "UI/UX Pro Max assets installed at .agents/skills/ui-ux-pro-max"
printf '%s\n' "Run the project's AI coding agent from the repository root after installation."
