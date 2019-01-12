#!/bin/sh
cd "$(dirname "$0")"

go run vendor/github.com/thijzert/go-resemble/cmd/go-resemble/main.go \
	-o assets.go \
	assets

go build -o faceflash *.go

