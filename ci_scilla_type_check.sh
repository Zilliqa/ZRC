container=`docker run -d -p 5555:5555 --entrypoint isolatedServer zilliqa/zilliqa-isolated-server:a01fe00 -t 1000 -u 0 -f boot.json`
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

rm_container=`docker stop $container | xargs docker rm`
echo $rm_container

