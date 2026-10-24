#!/bin/bash
P=10200
for seed in 12345 7 21 99; do
 for rep in a b; do
  if [ $rep = b ] && [ $seed != 12345 ]; then continue; fi
  for cond in "main /tmp/ca2main ''" "mainjs /tmp/ca2main nowasm=1" "cand /tmp/ca2r ''" "candjs /tmp/ca2r nowasm=1"; do
   set -- $cond; q=$3; [ "$q" = "''" ] && q=''
   P=$((P+1)); /tmp/runcmp.sh $1-$rep $2 "$q" $seed $P >> /tmp/matrix.log 2>&1
  done
 done
done
echo DONE >> /tmp/matrix.log
