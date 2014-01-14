
$(function()
{
	var faces = null;

	$("#faceflash").toggleClass( "loading", true );

	var enter_stage = function()
	{
		var stages = {
			welcome: $("#faceflash > div#welcome"),
			countdown: $("#faceflash > div#countdown"),
			game: $("#faceflash > div#game"),
			score: $("#faceflash > div#score")
		}

		return function( stage )
		{
			if ( !stages[stage] )  return;

			$("#faceflash > div:visible").fadeOut( 300 );
			stages[stage].fadeIn( 400 );
		}
	}();

	var start_game = function()
	{
		var flash_container = $("#game #flash_container");
		var flash_message = function( message, cls )
		{
			var P = $("<p></p>").append(message).addClass(cls);
			flash_container.prepend(P);

			setTimeout( function()
			{
				P.fadeOut( 4000, function()
				{
					P.remove();
				});
			}, 4000 );
		};

		var Countdown = {
			timeout: 1000,
			overlap:  800,
			container: $("#game > div#countdown"),
			blip: function( num, callback )
			{
				return function()
				{
					var N = $("<span></span>").html( num );
					Countdown.container.prepend( N );
					N.animate( { "font-size": "200px", opacity: 0.0 },
						Countdown.timeout + Countdown.overlap,
						function()
						{
							N.remove();
						} );
					window.setTimeout( num == 1 ? callback : Countdown.blip( num - 1, callback ), Countdown.timeout )
				}
			}
		};

		var shuffle_array = function(o)
		{
			for ( var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		};

		var ipt = $("#game #form input");
		var hash = null;
		var this_round = [];
		var remaining = [];
		var incorrect = 0;

		var next_round = function()
		{
			this_round = shuffle_array( remaining );
			remaining = [];
		};

		var next_face = function()
		{
			if ( this_round.length == 0 )
			{
				next_round();
				if ( this_round.length == 0 )
				{
					enter_stage( "score" );
					return;
				}
			}

			hash = this_round[0];
			$("#game #portrait img").attr( "src", "face/" + hash );
			ipt.val('').focus();
		};

		var FA = {
			spc: $('<i class="spacer"></i>'),
			check: $('<i class="fa fa-check"></i>'),
			down: $('<i class="fa fa-thumbs-down"></i>'),
			info: $('<i class="fa fa-info-circle"></i>')
		};

		var amiright = function()
		{
			if ( !hash )  return;
			var theface = faces[hash];
			var name = ipt.val().toLowerCase();

			var rv = false;
			for ( var i = 0; i < theface.Names.length; i++ )
				if ( theface.Names[i].toLowerCase() === name )
					rv = true;

			this_round.splice(0,1);
			if ( rv )
			{
				var msg = [
					FA.check.clone(),
					FA.spc.clone(),
					$("<strong />").text(name),
					" is correct."
				];
				flash_message( msg, "correct" );

				next_face();
			}
			else
			{
				remaining.push( hash )

				var msg = [
					FA.down.clone(),
					FA.spc.clone(),
					$("<small />").text(name),
					" was incorrect; I was looking for ",
					$("<strong />").text(theface.Names[0])
				];
				flash_message( msg, "incorrect" );

				setTimeout( next_face, 1000 );
				hash = null;
			}
		};

		ipt.keypress(function( e )
		{
			if ( e.which != 13 )  return true;
			amiright();
			return false;
		});



		var actual_game = function()
		{
			console.log( "The game is afoot, dear Watson." );

			incorrect = 0;
			remaining = [];
			hash = null;

			for ( var h in faces )
				if ( faces[h].Names )
					remaining.push( h );
			next_face();
		};

		return function( when )
		{
			enter_stage( "game" );

			if ( when === "right now" )
				actual_game();
			else
				Countdown.blip( 5, actual_game )();
		}
	}();

	$.ajax({
		url: "faces.json",
		dataType: "json",
		success: function( data )
		{
			faces = data;
			$("#faceflash").toggleClass( "loading", false );

			// For debugging purposes: 
			if ( location.hash === "#skip-to-the-game" )
				start_game( "right now" );
			else
				enter_stage( "welcome" );
		}
	});

	$("#welcome button, #score button.again").click( start_game );
});

