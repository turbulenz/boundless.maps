#!/usr/bin/env python
from argparse import ArgumentParser, FileType
from json import load as json_load, dump as json_dump
from os.path import basename as path_basename

parser = ArgumentParser()
parser.add_argument("stats", help="beacon stat files to process", type=FileType("r"), nargs="+", metavar="JSON")
args = parser.parse_args()

for f in args.stats:
    output_name = f"{path_basename(f.name)}"
    if len(args.stats) > 1:
        print(f"# {f.name} -> {output_name}")

    data = json_load(f)
    beacons = data.get("beacons")
    for r, row in enumerate(data.get("map", [])):
        for c, column in enumerate(row):
            if column and column.get("plots", 0):
                # Add column to beacon
                beacon_id = column.get("beacon")
                assert(beacon_id)
                b = beacons.get(beacon_id)
                beacon_columns = b.get("columns", [ ])
                beacon_columns.extend([r, c])
                b["columns"] = beacon_columns

    with open(output_name, "w") as g:
        json_dump(beacons, g, separators=(',', ':'))
