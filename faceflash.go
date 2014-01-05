
package main

import (
    "github.com/hoisie/web"
    "io/ioutil"
    "regexp"
    "mime"
    "path/filepath"
)



var dots = regexp.MustCompile( "\\.+" );

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

func main() {
	s := web.NewServer()

	s.Get( "/assets/(.*)", read_asset );
	s.Run( "127.0.0.1:9999" );
}

