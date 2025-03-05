#!/bin/bash

tune_main() {
    local passphrase
    local salt
    local version
    local mode
    local map
    local length
    local sum
    local seed
    local result
    local i
    local seed_index
    local seed_number
    local index
    local char
    local last

    read -p "passphrase : " passphrase
    read -p "service : " salt
    read -p "version : " version
    read -p "mode (0: ex, 1: full, 2: short) : " mode

    case "$mode" in
    0)
        map="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-/:;()&@.,?!'[]{}#%^*+=_|<>$"
        ;;
    1)
        map="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#&*%!?@#&*%!?@#&*%!?"
        ;;
    2)
        map="0123456789abcdefghijklmnopqrstuvwxyz"
        ;;
    *)
        echo "choose mode in [ 1 , 2 ]"
        exit 1
        ;;
    esac

    read -p "length : " length

    sum=0
    tune_summary "$passphrase"
    tune_summary "$salt"
    tune_summary "$version"
    sum=$((sum * length))

    seed="$sum$sum"

    result=""
    last=""
    i=0
    while [ "${#result}" -lt "$length" ]; do
        seed_index=$((i % ${#sum}))
        seed_number=${seed:$seed_index:3}
        seed_number=${seed_number#0}
        seed_number=${seed_number#0}
        index=$(((seed_number * (i + 1)) % ${#map}))
        char=${map:$index:1}
        if [ "$char" != "$last" ]; then
            result="$result$char"
            echo -n "."
        fi
        i=$((i + 1))
        last=$char
    done
    echo

    echo "password : $result"
}

tune_summary() {
    local str
    local i
    local char
    local tip
    str=$1

    for i in $(seq 1 ${#str}); do
        i=$((i - 1))
        char=${str:i:1}
        tip=$(echo "$char" | cksum)
        sum=$((sum + ${tip% *}))
    done
}

tune_main
