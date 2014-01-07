
package main

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime"
	"path/filepath"
	"regexp"

	"github.com/hoisie/web"
)


type FaceMap map[string]Face

type Face struct {
	filename string
	Names []string
}


func ( fm FaceMap ) ParseDir( dir string ) {
	files, err := ioutil.ReadDir( dir )
	if err != nil { return }

	for _, file := range files {
		if file.IsDir() { continue }
		sha := sha1sum( dir + "/" + file.Name() )
		ff, ok := fm[sha]
		if ok {
			ff.AppendName( file.Name() )
		} else {
			fm[sha] = Face{ dir + "/" + file.Name(), []string{ file.Name() } }
		}
	}
}
func ( ff Face ) SetFile( file string ) {
	ff.filename = file
}
func ( ff Face ) AppendName( name string ) {
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


func sha1sum( filename string ) string {
	s := sha1.New()
	b, err := ioutil.ReadFile( filename )
	if err != nil { return "" }
	s.Write( b )
	return fmt.Sprintf( "%x", s.Sum( nil ) )
}


var dots = regexp.MustCompile( "\\.+" )

func read_asset( ctx *web.Context, filename string )  {

	filename = "./assets/" + dots.ReplaceAllString( filename, "." )
	bytes, err := ioutil.ReadFile( filename );

	if err != nil {
		ctx.NotFound( "Not found" )
	} else {
		var mt string = mime.TypeByExtension( filepath.Ext( filename ) );
		if mt == "" { mt = "text/plain; charset=UTF-8"; }
		ctx.SetHeader( "Content-type", mt, true );
		ctx.Write( bytes );
	}
}



var ImageFolder = "/path/to/images"

func main() {
	s := web.NewServer()

	fm := make(FaceMap)
	fm.ParseDir( ImageFolder )

	s.Get( "/assets/(.*)", read_asset );

	s.Get( "/faces.json", func( ctx *web.Context ) {
		ctx.SetHeader( "Content-type", "application/json", true );
		js, _ := json.Marshal( fm )
		ctx.Write( js )
	} )

	s.Run( "127.0.0.1:9999" );
}

