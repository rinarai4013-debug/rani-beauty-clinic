#!/usr/bin/env python3
"""Deploy Airtable table spec for Smoke Test Runs."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict


def get_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def request(method: str, url: str, token: str, body: Dict[str, Any] | None = None) -> Dict[str, Any]:
    payload = None
    headers = {
        "Authorization": f"Bearer {token}",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
        payload = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode("utf-8") if res.readable() else ""
            return {
                "status": res.status,
                "body": json.loads(raw) if raw else {},
            }
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="ignore")
        print(f"[airtable] {method} {url} -> {err.code}")
        if raw:
            print(raw)
        raise RuntimeError(f"HTTP {err.code} from Airtable metadata API") from err


def load_patch(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise RuntimeError(f"Patch file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict) or "tables" not in data:
        raise RuntimeError("Invalid patch file: expected object with key 'tables'.")
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update the Smoke Test Runs Airtable table.")
    parser.add_argument(
        "--patch",
        default=str(Path(__file__).resolve().parents[1] / "airtable" / "smoke_test_runs_patch.json"),
        help="Path to smoke_test_runs_patch.json",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate patch JSON without making network calls.")
    args = parser.parse_args()

    token = get_env("AIRTABLE_PAT")
    base_id = get_env("AIRTABLE_BASE_ID")
    patch = load_patch(Path(args.patch))

    tables = patch.get("tables")
    if not isinstance(tables, list) or not tables:
        raise RuntimeError("Patch file has no tables.")

    if args.dry_run:
        print(json.dumps({"airtable_base_id": base_id, "tables": [table["name"] for table in tables]}, indent=2))
        return

    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    body = {"tables": tables}
    result = request("POST", url, token, body)

    print(f"[airtable] Smoke Test Runs patch request status: {result['status']}")
    print(f"[airtable] Response: {json.dumps(result['body'], indent=2)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"[airtable] Deployment failed: {error}")
        sys.exit(1)
