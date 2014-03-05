
package main

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"log"
	"io/ioutil"
	"mime"
	"path/filepath"
	"regexp"

	"github.com/hoisie/web"
)


type FaceMap map[string]*Face

type Face struct {
	filename string
	Names []string
}


func ( fm FaceMap ) ParseDir( dir string ) {
	files, err := ioutil.ReadDir( dir )
	if err != nil { log.Fatal(err) }

	fmt.Printf( "Descending into \"%s\"\n", dir )

	// Add any files first
	for _, file := range files {
		if file.IsDir() { continue }

		path := dir + "/" + file.Name()
		name := file.Name()
		ext := filepath.Ext( path )
		if len(ext) > 0 {  name = name[0:len(name) - len(ext)]  }

		sha := sha1sum( path )
		ff, ok := fm[sha]
		if ok {
			ff.AppendName( name )
		} else {
			fm[sha] = &Face{ path, []string{ name } }
		}
	}

	fmt.Printf( "%d images so far\n", len(fm) )

	// Now recursively descend into directories
	for _, file := range files {
		if ! file.IsDir() { continue }
		fm.ParseDir( dir + "/" + file.Name() )
	}
}
func ( ff Face ) SetFile( file string ) {
	ff.filename = file
}
func ( ff *Face ) AppendName( name string ) {
	n := len(ff.Names)
	if n == cap(ff.Names) {
		// Slice is full; must grow.
		// We double its size and add 1, so if the size is zero we still grow.
		newSlice := make([]string, len(ff.Names), 2*len(ff.Names)+1)
		copy(newSlice, ff.Names)
		ff.Names = newSlice
	}
	ff.Names = ff.Names[0 : n+1]
	ff.Names[n] = name
}

func ( ff Face ) ReadFile( ctx *web.Context ) {
	read_file( ctx, ff.filename )
}


func sha1sum( filename string ) string {
	s := sha1.New()
	b, err := ioutil.ReadFile( filename )
	if err != nil { return "" }
	s.Write( b )
	return fmt.Sprintf( "%x", s.Sum( nil ) )
}


func read_file( ctx *web.Context, filename string )  {

	bytes, err := ioutil.ReadFile( filename );

	if err != nil {
		ctx.NotFound( "Not found" )
	} else {
		var mt string = mime.TypeByExtension( filepath.Ext( filename ) );
		if mt == "" { mt = "text/plain; charset=UTF-8"; }
		ctx.SetHeader( "Content-type", mt, true );
		ctx.SetHeader( "Content-length", fmt.Sprintf("%d",len(bytes)), true );
		ctx.Write( bytes );
	}
}

var dots = regexp.MustCompile( "\\.+" )
func read_asset( ctx *web.Context, filename string )  {
	read_file( ctx, "./assets/" + dots.ReplaceAllString( filename, "." ) )
}



var ImageFolder = "/path/to/images"

func main() {
	s := web.NewServer()

	fm := make(FaceMap)
	fm.ParseDir( ImageFolder )

	s.Get( "/assets/(.*)", read_asset );
	s.Get( "/favicon.ico", func( ctx *web.Context ) { read_asset( ctx, "images/favicon.ico" ) } )

	s.Get( "/faces.json", func( ctx *web.Context ) {
		ctx.SetHeader( "Content-type", "application/json; charset=UTF-8", true );
		js, _ := json.Marshal( fm )
		ctx.Write( js )
	} )
	s.Get( "/face/([0-9a-f]{40})", func( ctx *web.Context, hash string ) {
		ff, ok := fm[ hash ]
		if ok {
			ff.ReadFile( ctx )
		} else {
			ctx.NotFound( "Unknown face" )
		}
	} )

	s.Get( "/", func( ctx *web.Context ) { read_asset( ctx, "application.html" ) } )

	s.Run( "0.0.0.0:9999" );
}

