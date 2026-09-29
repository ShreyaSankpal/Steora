import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

def get_roost_executable():
    python_dir = Path(sys.executable).parent
    roost_path = python_dir / "Scripts" / "roost.exe"

    if not roost_path.exists():
        raise FileNotFoundError(
            f"Roost executable not found at: {roost_path}"
        )

    return str(roost_path)


def search_hotels(
    location,
    check_in,
    check_out,
    adults=2,
    children=0,
    currency="INR",
):
    roost = get_roost_executable()

    command = [
        roost,
        "search",
        location,
        "--check-in",
        check_in,
        "--check-out",
        check_out,
        "--adults",
        str(adults),
        "--children",
        str(children),
        "--currency",
        currency,
        "--format",
        "json",
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip()
            or "Roost hotel search failed."
        )

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"Roost returned invalid JSON: {error}"
        )


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(
            "Usage: python roost_bridge.py "
            "<location> <check-in> <check-out>"
        )
        sys.exit(1)

    location = sys.argv[1]
    check_in = sys.argv[2]
    check_out = sys.argv[3]

    data = search_hotels(
        location=location,
        check_in=check_in,
        check_out=check_out,
    )

    print(json.dumps(data, ensure_ascii=False))