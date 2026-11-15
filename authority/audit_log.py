import json
import os
import time
from pathlib import Path
from typing import List, Dict, Any

BASE_DIR = Path(__file__).resolve().parent
LOG_PATH = BASE_DIR / "audit_log.jsonl"


def log_decision(
    role_id: str,
    action_type: str,
    resource: str,
    allowed: bool,
    reason: str = "",
) -> None:
    entry = {
        "ts": round(time.time(), 3),
        "role": role_id,
        "action_type": action_type,
        "resource": resource,
        "allowed": allowed,
        "reason": reason or ("policy_allow" if allowed else "policy_deny"),
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def read_audit_logs(limit: int = 100) -> List[Dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    with open(LOG_PATH, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    entries = []
    for line in lines[-limit:]:
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return list(reversed(entries))


def clear_audit_logs() -> None:
    if LOG_PATH.exists():
        os.remove(LOG_PATH)

