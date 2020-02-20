#!/usr/bin/env python
from argparse import ArgumentParser
from os import makedirs as os_makedirs
from os.path import basename as path_basename, splitext as path_splitext
from subprocess import run as subprocess_run

parser = ArgumentParser()
parser.add_argument("images", help="images to split", type=str, nargs="+", metavar="PNG")
args = parser.parse_args()

for image in args.images:
    basename, _ = path_splitext(path_basename(image))
    if len(args.images) > 1:
        print(f"# {image} -> {basename}")

    for z in [0, 1, 2]:
        try:
            os_makedirs(f"{basename}/{z}")
        except FileExistsError:
            pass

    subprocess_run(
        args=f"convert {image} -resize 4608x4608 -crop 128x128 -set filename:f {basename}_X%[fx:page.x/128]_Y%[fx:page.y/128]_Z2 {basename}/2/%[filename:f].png".split()
    )
    subprocess_run(
        args=f"convert {image} -resize 2304x2304 -crop 128x128 -set filename:f {basename}_X%[fx:page.x/128]_Y%[fx:page.y/128]_Z1 {basename}/1/%[filename:f].png".split()
    )
    subprocess_run(
        args=f"convert {image} -resize 1152x1152 -crop 128x128 -set filename:f {basename}_X%[fx:page.x/128]_Y%[fx:page.y/128]_Z0 {basename}/0/%[filename:f].png".split()
    )
