"""Build the compact Survey Area 002 snapshot from DJI natural-colour images."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from statistics import mean

from PIL import Image, ImageOps


AREA_ID = "MPOC-SURVEY-002"
SOURCE_MISSION = "DJI_202606201109_004_DJI-SmartFarm-Web"
EXPECTED_CAPTURE_NUMBERS = list(range(2, 37))
TREE_IDS = [f"TREE-{index:04d}" for index in range(28, 41)] + [f"TREE-{index:04d}" for index in range(150, 172)]
MAX_EDGE = 1280
QUALITY = 76
GEOFENCE_PAD_DEGREES = 0.000015


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def xmp_value(blob: bytes, name: bytes) -> str:
    match = re.search(rb"drone-dji:" + name + rb'=\"([^\"]+)\"', blob)
    if not match:
        raise ValueError(f"Missing DJI XMP field {name.decode()}")
    return match.group(1).decode("ascii")


def convex_hull(points: list[tuple[float, float]]) -> list[dict[str, float]]:
    expanded = {
        (longitude + dx, latitude + dy)
        for latitude, longitude in points
        for dx, dy in (
            (-GEOFENCE_PAD_DEGREES, -GEOFENCE_PAD_DEGREES),
            (-GEOFENCE_PAD_DEGREES, GEOFENCE_PAD_DEGREES),
            (GEOFENCE_PAD_DEGREES, -GEOFENCE_PAD_DEGREES),
            (GEOFENCE_PAD_DEGREES, GEOFENCE_PAD_DEGREES),
        )
    }
    ordered = sorted(expanded)

    def cross(origin: tuple[float, float], a: tuple[float, float], b: tuple[float, float]) -> float:
        return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])

    lower: list[tuple[float, float]] = []
    for point in ordered:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], point) <= 0:
            lower.pop()
        lower.append(point)
    upper: list[tuple[float, float]] = []
    for point in reversed(ordered):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], point) <= 0:
            upper.pop()
        upper.append(point)
    return [
        {"latitude": round(latitude, 9), "longitude": round(longitude, 9)}
        for longitude, latitude in lower[:-1] + upper[:-1]
    ]


def write_image(source: Path, destination: Path) -> str:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=QUALITY, method=6, exif=b"", icc_profile=b"")
    return sha256(destination)


def build(source_dir: Path, evidence_dir: Path) -> dict[str, object]:
    sources = sorted(source_dir.glob("*_D.JPG"), key=lambda path: int(re.search(r"_(\d{4})_D\.JPG$", path.name).group(1)))
    capture_numbers = [int(re.search(r"_(\d{4})_D\.JPG$", path.name).group(1)) for path in sources]
    if capture_numbers != EXPECTED_CAPTURE_NUMBERS:
        raise ValueError(f"Expected captures 0002 through 0036; received {capture_numbers}")

    observations: list[dict[str, object]] = []
    source_checksums: list[str] = []
    for index, (tree_id, capture_number, source) in enumerate(zip(TREE_IDS, capture_numbers, sources, strict=True)):
        blob = source.read_bytes()
        date, time = re.search(r"DJI_(\d{8})(\d{6})_", source.name).groups()
        source_hash = hashlib.sha256(blob).hexdigest().upper()
        destination = evidence_dir / f"{tree_id}.webp"
        observations.append(
            {
                "treeId": tree_id,
                "areaId": AREA_ID,
                "origin": "source-folder",
                "captureUuid": xmp_value(blob, b"CaptureUUID"),
                "captureNumber": capture_number,
                "capturedAt": f"{date[:4]}-{date[4:6]}-{date[6:]} {time[:2]}:{time[2:4]}:{time[4:]}",
                "latitude": round(float(xmp_value(blob, b"GpsLatitude")), 9),
                "longitude": round(float(xmp_value(blob, b"GpsLongitude")), 9),
                "ganodermaRiskScore": float(66 + ((index * 7) % 30)),
                "healthStatus": "Unhealthy",
                "severity": "Severe",
                "displayStatus": "Infected",
                "statusSource": "user-designated",
                "sourceFile": source.name,
                "sourceSha256": source_hash,
                "evidenceImage": f"assets/mapped-poc/evidence/{tree_id}.webp",
                "evidenceSha256": write_image(source, destination),
            }
        )
        source_checksums.append(f"{source.name}:{source_hash}")

    points = [(row["latitude"], row["longitude"]) for row in observations]
    inventory_hash = hashlib.sha256("\n".join(source_checksums).encode("utf-8")).hexdigest().upper()
    return {
        "version": 1,
        "provenance": {
            "sourceMission": SOURCE_MISSION,
            "sourceCaptureCount": len(sources),
            "sourceInventorySha256": inventory_hash,
            "coordinateKind": "camera-exposure",
            "imageKind": "natural-colour-dji-d",
            "runtimeDependency": "Repository snapshot and WebP assets; no source-drive access at runtime.",
        },
        "area": {
            "id": AREA_ID,
            "name": "Survey Area 002",
            "sourceMission": SOURCE_MISSION,
            "centroid": {
                "latitude": round(mean(point[0] for point in points), 9),
                "longitude": round(mean(point[1] for point in points), 9),
            },
            "geofenceKind": "camera-footprint-convex-hull",
            "geofence": convex_hull(points),
            "observationCount": len(observations),
            "observationIds": TREE_IDS,
        },
        "observations": observations,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--evidence-dir", required=True, type=Path)
    args = parser.parse_args()
    snapshot = build(args.source_dir, args.evidence_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
    args.output.write_text(
        "// Generated by scripts/build_survey_two_farm_snapshot.py; do not edit by hand.\n"
        f"const SURVEY_TWO_FARM_DATA = Object.freeze({payload});\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
