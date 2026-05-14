"""Population-atlas extractors — parse captured slot bytes into staging
payloads.

Two parsers (one per runner output):
  extract              — non-templated slots from /api/population/{slot}
  extract_ngsadmix_q   — K-templated slot from /api/population/ngsadmix/q/{K}

Both echo the raw JSON under `body` so downstream pages can read it via
the layer registry instead of by file path. Normalize per-slot later.
"""
from __future__ import annotations

import json
import pathlib
from typing import Any, Dict


def _load_or_quote(path: pathlib.Path) -> Any:
    """Try JSON parse; if it fails, keep the raw text under a sentinel
    so the staging layer is still useful for debugging."""
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except Exception:
        return {"_invalid_json": True, "_raw_text": text}


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["slot_json"])
    return {
        "slot":  raw_outputs.get("slot"),
        "body":  _load_or_quote(path),
        "bytes": path.stat().st_size,
    }


def extract_ngsadmix_q(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    path = pathlib.Path(raw_outputs["qmatrix_json"])
    K = int(raw_outputs.get("K") or 0)
    return {
        "K":     K,
        "body":  _load_or_quote(path),
        "bytes": path.stat().st_size,
    }
