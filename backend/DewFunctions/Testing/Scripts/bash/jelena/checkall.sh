i=0
while [ $i -le 14 ] ; do
    echo "NODE $i"
    ssh node-$i.large.senss "ps axuw | grep perl"
    i=$(($i+1))
done