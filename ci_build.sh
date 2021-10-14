container=`docker run -d -t zilliqa/scilla:latest`
echo $container

scilla="/scilla/0/"
checker="${scilla}bin/scilla-checker"
stdlib="${scilla}src/stdlib"
gas_limit="9999999"

for src in reference/*.scilla; do
    file="zrc_${src##*/}"
    check="docker exec $container $checker -libdir $stdlib -gaslimit $gas_limit ${scilla}${file}"
    copy="docker cp ./$src $container:${scilla}/$file"
    cleanup="docker exec $container rm -rf ${scilla}/$file"

    $copy > /dev/null || { echo "copy failed: $file"; exit 1; }
    $check > /dev/null || { echo "type-checking failed: $file"; exit 1; }
    $cleanup > /dev/null || { echo "cleanup failed: $file"; exit 1; }
    
    echo "PASS:$file"
done
