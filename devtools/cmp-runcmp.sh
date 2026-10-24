#!/bin/bash
# usage: runcmp.sh label root query seed port
cd /tmp/ca2r; pkill chrome
ROOT=$2 SEED=$4 TRACE=1 RDYSLEEP=300 TON=0 timeout 75 node devtools/t143-fixedstep.js "$3" $5 10 > /tmp/cmp-$1-s$4.txt 2>&1
echo "$1 seed $4: $(grep -ac '^TRACE' /tmp/cmp-$1-s$4.txt) trace; $(grep -a '^wasm\|^nowasm\|^[a-z]* n=' /tmp/cmp-$1-s$4.txt | grep -o '"merge":[0-9]*,"fuse":[0-9]*,"pair":[0-9]*,"eaten":[0-9]*,"birth":[0-9]*,"death":[0-9]*,"divide":[0-9]*' | head -1)"
