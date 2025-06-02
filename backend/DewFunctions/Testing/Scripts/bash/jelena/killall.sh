i=0
while [ $i -le 15 ] ; do
    echo "NODE $i"
    ssh node-$i.large.senss "sudo pkill -9 perl"
    i=$(($i+1))
done
