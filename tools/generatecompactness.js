#!/usr/bin/env node

var path = "./../_beaconstats";

function verify(path)
{
    var stats = require(path);
    var size = stats.map.length;

    function wrap(x,z)
    {
        while(x<0) x += size;
        while(z<0) z += size;
        while(x>=size) x -= size;
        while(z>=size) z -= size;
        return [x,z];
    }
    function map(x,z)
    {
        var stat = stats.map[z][x];
        return stat && stat.beacon ? stat : null; // ignore just "reservedBy" entries
    }

    for (id in stats.beacons)
    {
        stats.beacons[id].columns = [];
    }

    for (var x = 0; x < size; ++x)
    for (var z = 0; z < size; ++z)
    {
        var b = map(x,z);
        if (b)
        {
            stats.beacons[b.beacon].columns.push({xz:[x,z],plots:b.plots});
        }
    }

    // current reservation-buffer-radius-based compactness
    for (id in stats.beacons)
    {
        var beacon = stats.beacons[id];
        var counted = {};
        var perimeter = 0;
        var numPlots = 0;
        for (var i = 0; i < beacon.columns.length; ++i)
        {
            var c = beacon.columns[i];
            counted[c.xz.join(",")] = true;
            numPlots += c.plots;
        }
        if (numPlots != beacon.numPlots ||
            beacon.columns.length != beacon.numPlotColumns)
        {
            console.log("Bad plot counts " + id + " " + [numPlots,beacon.columns.length,beacon.numPlots,beacon.numPlotColumns].join(" "));
            require("process").exit(1);
        }
        for (var i = 0; i < beacon.columns.length; ++i)
        {
            var xz = beacon.columns[i].xz;
            for (z = -2; z <= 2; ++z)
            for (x = -2; x <= 2; ++x)
            {
                var xz2 = wrap(xz[0] + x, xz[1] + z);
                if (!counted[xz2.join(",")])
                {
                    counted[xz2.join(",")] = true;
                    if (!map(xz2[0], xz2[1]))
                    {
                        ++perimeter;
                    }
                }
            }
        }
        if (perimeter != beacon.perimeter)
        {
            console.log("Bad perimeter " + id + " " + [perimeter, beacon.perimeter].join(" "));
            require("process").exit(1);
        }
    }

    // "exposed faces" compactness (not same as empty neighbouring plots which behaves weirdly)
    for (id in stats.beacons)
    {
        var beacon = stats.beacons[id];
        var facePerimeter = 0;
        for (var i = 0; i < beacon.columns.length; ++i)
        {
            var xz = beacon.columns[i].xz;
            for (z = -1; z <= 1; ++z)
            for (x = -1; x <= 1; ++x)
            {
                if (Math.abs(x) + Math.abs(z) != 1) continue; // direct neighbours only
                var xz2 = wrap(xz[0] + x, xz[1] + z);
                if (!map(xz2[0], xz2[1]))
                {
                    ++facePerimeter;
                }
            }
        }
        var faceCompactness = facePerimeter == 0 ? 1 :
                              Math.min(1, 4.0 * Math.sqrt(beacon.numPlotColumns) / facePerimeter);
        if (beacon.compactness != faceCompactness) // only ever going to hit when both are 1, aka just ignore the 1->1 case
        {
            console.log(beacon.name + "(" + id + "): " +
                        [beacon.compactness, faceCompactness].join("->") + " (" +
                        [beacon.perimeter, facePerimeter].join("->") + ")");
        }
        beacon.facePerimeter = facePerimeter;
        beacon.faceCompactness = faceCompactness;
        delete beacon.displayCompactness;
        delete beacon.columns;
    }

    require("fs").writeFileSync(path + ".2", JSON.stringify(stats));
}

var dir = require("fs").readdirSync(path)
for (var i = 0; i < dir.length; ++i)
{
    verify(path + "/" + dir[i]);
}