"""Разрешает конфликт слияния в data/image_credits.json: объединяет записи обеих веток."""
import json
import subprocess

P = "data/image_credits.json"
ours = json.loads(subprocess.run(["git", "show", f":2:{P}"], capture_output=True, text=True, encoding="utf-8").stdout or "{}")
theirs = json.loads(subprocess.run(["git", "show", f":3:{P}"], capture_output=True, text=True, encoding="utf-8").stdout or "{}")
ours.update(theirs)
open(P, "w", encoding="utf-8").write(json.dumps(dict(sorted(ours.items())), ensure_ascii=False, indent=1))
subprocess.run(["git", "add", P])
print("записей:", len(ours))
