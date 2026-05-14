"""Population-atlas runners — wrap the ancestry compute endpoint.

`compute_q` POSTs to /api/ancestry/groupwise_q (atlas-core's instant_q
cache aggregator), captures the JSON response to raw_results/, and
returns the path so the extractor can wrap it in a staging envelope.
"""
from __future__ import annotations

import json
import os
import pathlib
from typing import Any, Dict


def _workdir(manifest: Dict[str, Any]) -> pathlib.Path:
    root = pathlib.Path(os.environ.get("ATLAS_PROJECT_ROOT") or pathlib.Path.cwd())
    return root / "raw_results" / "ancestry" / manifest["action_id"]


def compute_q(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    """Call /api/ancestry/groupwise_q. Returns the path to the response JSON."""
    target = manifest.get("target") or {}
    params = manifest.get("params") or {}

    body: Dict[str, Any] = {
        "chrom":  target["chrom"],
        "groups": target["groups"],
        "K":      int(params["K"]),
        "scale":  params.get("scale", "dense"),
    }
    if "start_bp" in target and "end_bp" in target:
        body["region"] = {
            "start_bp": int(target["start_bp"]),
            "end_bp":   int(target["end_bp"]),
        }

    resp = client.post("/api/ancestry/groupwise_q", body)

    out_dir = _workdir(manifest)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "ancestry_groupwise_q.json"
    out_path.write_text(json.dumps(resp, indent=2), encoding="utf-8")
    return {"ancestry_q_json": str(out_path)}
