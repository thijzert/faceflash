#!/bin/sh
cd "$(dirname "$0")"

rm -f faceflash

go run vendor/github.com/thijzert/go-resemble/cmd/go-resemble/main.go \
	-debug \
	-p main -o assets.go \
	assets \
	|| exit 1

exec go run *.go "$@"

