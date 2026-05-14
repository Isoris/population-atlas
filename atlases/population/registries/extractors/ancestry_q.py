"""Population-atlas extractors — pass-through staging for ancestry-Q.

The /api/ancestry/groupwise_q response already carries chrom / region / K /
scale / source / per-group aggregations. We promote those top-level keys
into the staging payload so the layers index can filter on chrom + K
without opening every envelope. The detailed per-group shape stays
under whichever keys the server returned (loose, additionalProperties).
"""
from __future__ import annotations

import json
import pathlib
from typing import Any, Dict


# Keys the server returns at the top level of the response (excluding the
# cache/debug fields). Anything else passes through under 'extra'.
_TOP_KEYS = ("chrom", "region", "K", "scale", "source")
_DROP_KEYS = ("kind", "_cache", "_cache_key")


def extract(raw_outputs: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    src = pathlib.Path(raw_outputs["ancestry_q_json"])
    doc = json.loads(src.read_text(encoding="utf-8"))

    out: Dict[str, Any] = {}
    for k in _TOP_KEYS:
        if k in doc:
            out[k] = doc[k]
    # Anything beyond the known top keys (e.g. per-group aggregations whose
    # exact shape the upstream agg() function controls) goes under groups.
    extra = {k: v for k, v in doc.items()
             if k not in _TOP_KEYS and k not in _DROP_KEYS}
    if extra:
        out["groups"] = extra
    return out
