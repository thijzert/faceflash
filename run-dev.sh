#!/bin/sh
cd "$(dirname "$0")"

rm -f faceflash

test -x vendor/github.com/thijzert/go-resemble/go-resemble \
	|| go build -o vendor/github.com/thijzert/go-resemble/go-resemble \
		vendor/github.com/thijzert/go-resemble/cmd/go-resemble/main.go

vendor/github.com/thijzert/go-resemble/go-resemble \
	-debug \
	-p main -o assets.go \
	assets \
	|| exit 1

exec go run *.go "$@"

