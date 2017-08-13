= Faceflash =
Faceflash creates 'face flashcards' to quickly learn a lot of new names.

== Usage ==
From the command line, execute

    faceflash -folder /path/to/images

This will open a web server on port 9999. Point your browser to it to start.

== Compilation from source ==
First, install third-party dependencies:

    go get -u -d github.com/hoisie/web
    go get -u github.com/jteeuwen/go-bindata/...

Then, package the static resources using either `go-bindata assets` (for production builds) or `go-bindata -debug assets` (for development).

Then use `go build` as usual.
