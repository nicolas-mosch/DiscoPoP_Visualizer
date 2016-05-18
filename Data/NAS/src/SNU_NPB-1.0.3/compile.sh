#!/bin/bash
for filename in $@
do
    bcname=${filename%.*}.bc
    echo "compiling $filename to IR $bcname"
    clang -g -c -O0 -emit-llvm $filename -o $bcname
    echo "analyzing $bcname"
    ../main/DiscoPoP $bcname
    outname=$bcname.out
    echo "making graph for $outname"
    python ../../work/proc/graph.py $outname
    echo "running graphviz"
    dot ${outname%.*}.dot -Tpdf > ${outname%.*}.pdf
done
