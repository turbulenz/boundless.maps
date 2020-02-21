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

    for z, resize in enumerate([144, 288, 576, 1152, 2304, 4608]):
        for y in range(resize // 144):
            try:
                path = f"{basename}/{z}/{y}"
                print(f"# Creating: {path}")
                os_makedirs(path)
            except FileExistsError:
                pass

        subprocess_run(
            args=f"convert {image} -resize {resize}x{resize} -crop 144x144 -set filename:f {basename}/z{z}/y%[fx:page.y/144]/x%[fx:page.x/144] %[filename:f].png".split()
        )
