#!/bin/bash
# Слить ветки уроков в main с проверкой: scripts/merge_lessons.sh lessons/169-170 [lessons/...]
# Конфликт в data/image_credits.json разрешается объединением; другие конфликты — слияние отменяется.
set -u
cd "$(dirname "$0")/.."
PY=.venv/Scripts/python.exe
git fetch -q
for b in "$@"; do
  git merge -q --no-edit "origin/$b" >/dev/null 2>&1
  u=$(git diff --name-only --diff-filter=U)
  if [ -n "$u" ]; then
    if [ "$u" = "data/image_credits.json" ]; then
      PYTHONIOENCODING=utf-8 $PY scripts/merge_credits.py >/dev/null
      git -c user.name="Niksoul1881" -c user.email="yakushev.n.k90@gmail.com" commit -qm "Слияние $b"
    else
      echo "!! $b: конфликт в $u — слияние отменено"; git merge --abort; continue
    fi
  fi
  echo "влито: $b"
done
PYTHONIOENCODING=utf-8 $PY scripts/check_lessons.py
