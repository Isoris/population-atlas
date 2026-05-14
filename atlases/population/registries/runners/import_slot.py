"""Population-atlas runners — file/HTTP capture of the JSON-shim slots.

Two entrypoints, both calling atlas-core's /api/population/* endpoints
(server/population_endpoint.py):

  import_slot         GET /api/population/{slot}              (8 fixed slots)
  import_ngsadmix_q   GET /api/population/ngsadmix/q/{K}      (K-templated)

Each persists the response bytes verbatim to raw_results/population/
<action_id>/ for provenance, then returns the path to the matching
extractor.
"""
from __future__ import annotations

import os
import pathlib
from typing import Any, Dict


def _workdir(manifest: Dict[str, Any]) -> pathlib.Path:
    root = pathlib.Path(os.environ.get("ATLAS_PROJECT_ROOT") or pathlib.Path.cwd())
    return root / "raw_results" / "population" / manifest["action_id"]


def import_slot(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    """GET /api/population/{slot} and persist the bytes verbatim.

    Returns:
        { "slot_json": "<absolute path>", "slot": "<slot name>" }
    """
    slot = manifest["target"]["slot"]
    raw = client.get(f"/api/population/{slot}")
    out_dir = _workdir(manifest)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slot}.json"
    out_path.write_bytes(raw)
    return {"slot_json": str(out_path), "slot": slot}


def import_ngsadmix_q(manifest: Dict[str, Any], client: Any) -> Dict[str, str]:
    """GET /api/population/ngsadmix/q/{K} and persist the bytes.

    Returns:
        { "qmatrix_json": "<absolute path>", "K": "<K as string>" }
    """
    K = int(manifest["target"]["K"])
    raw = client.get(f"/api/population/ngsadmix/q/{K}")
    out_dir = _workdir(manifest)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"ngsadmix_Q_K{K}.json"
    out_path.write_bytes(raw)
    return {"qmatrix_json": str(out_path), "K": str(K)}
