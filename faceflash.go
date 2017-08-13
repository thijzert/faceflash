package main

import (
	"crypto/sha1"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"mime"
	"path/filepath"
	"regexp"

	"github.com/hoisie/web"
)

type FaceMap map[string]*Face

type Face struct {
	filename string
	Names    []string
}

func (fm FaceMap) ParseDir(dir string) {
	// fmt.Printf( "Descending into \"%s\"\n", dir )

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatal(err)
	}

	// Add any files first
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if file.Size() == 0 {
			continue
		}

		path := dir + "/" + file.Name()
		name := file.Name()
		ext := filepath.Ext(path)
		if len(ext) > 0 {
			name = name[0 : len(name)-len(ext)]
		}

		sha := sha1sum(path)
		ff, ok := fm[sha]
		if ok {
			ff.AppendName(name)
		} else {
			fm[sha] = &Face{path, []string{name}}
		}
	}

	// Now recursively descend into directories
	for _, file := range files {
		if !file.IsDir() {
			continue
		}
		fm.ParseDir(dir + "/" + file.Name())
	}
}
func (ff Face) SetFile(file string) {
	ff.filename = file
}
func (ff *Face) AppendName(name string) {
	ff.Names = append(ff.Names, name)
}

func (ff Face) ReadFile(ctx *web.Context) {
	read_file(ctx, ff.filename)
}

func sha1sum(filename string) string {
	s := sha1.New()
	b, err := ioutil.ReadFile(filename)
	if err != nil {
		return ""
	}
	s.Write(b)
	return fmt.Sprintf("%x", s.Sum(nil))
}

func read_file(ctx *web.Context, filename string) {

	bytes, err := ioutil.ReadFile(filename)

	if err != nil {
		ctx.NotFound("Not found")
	} else {
		var mt string = mime.TypeByExtension(filepath.Ext(filename))
		if mt == "" {
			mt = "text/plain; charset=UTF-8"
		}
		ctx.SetHeader("Content-type", mt, true)
		ctx.SetHeader("Content-length", fmt.Sprintf("%d", len(bytes)), true)
		ctx.Write(bytes)
	}
}

var dots = regexp.MustCompile("\\.+")

func read_asset(ctx *web.Context, filename string) {
	read_file(ctx, "./assets/"+dots.ReplaceAllString(filename, "."))
}

var ImageFolder string
var BindIP string
var BindPort int

func main() {

	flag.StringVar(&ImageFolder, "folder", "", "where the images are located")
	flag.StringVar(&BindIP, "ip", "0.0.0.0", "the IP address to bind on")
	flag.IntVar(&BindPort, "port", 9999, "the port to listen on")
	flag.Parse()

	s := web.NewServer()

	if ImageFolder == "" && flag.NArg() > 0 {
		ImageFolder = flag.Args()[0]
	}

	fm := make(FaceMap)
	log.Printf("Faceflash starting; scanning directory %s...", ImageFolder)
	fm.ParseDir(ImageFolder)
	log.Printf("Done scanning.")

	s.Get("/assets/(.*)", read_asset)
	s.Get("/favicon.ico", func(ctx *web.Context) { read_asset(ctx, "images/favicon.ico") })

	s.Get("/faces.json", func(ctx *web.Context) {
		ctx.SetHeader("Content-type", "application/json; charset=UTF-8", true)
		js, _ := json.Marshal(fm)
		ctx.Write(js)
	})
	s.Get("/face/([0-9a-f]{40})", func(ctx *web.Context, hash string) {
		ff, ok := fm[hash]
		if ok {
			ff.ReadFile(ctx)
		} else {
			ctx.NotFound("Unknown face")
		}
	})

	s.Get("/", func(ctx *web.Context) { read_asset(ctx, "application.html") })

	s.Run(fmt.Sprintf("%s:%d", BindIP, BindPort))
}
