
$(function()
{
	var faces = null;

	$("#faceflash").toggleClass( "loading", true );

	var update_score = function( key, val )
	{
		$( ".scoreboard .score-" + key ).text( val );
	};

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
		var correct = 0;
		var round_no = 0;

		var next_round = function()
		{
			this_round = shuffle_array( remaining );
			remaining = [];

			round_no++;
			update_score( "round", round_no );
		};

		var next_face = function()
		{
			$("#portrait .hi-my-name-is").hide();
			$("#portrait .hi-my-name-is .name").text("");

			if ( this_round.length == 0 )
			{
				next_round();
				if ( this_round.length == 0 )
				{
					enter_stage( "score" );
					return;
				}
			}
			update_score( "remaining", this_round.length + remaining.length );

			hash = this_round[0];
			$("#game #portrait img").attr( "src", "face/" + hash );
			ipt.val('').focus();
		};

		var FA = {
			check: $('<div class="icon"><i class="fa fa-check"></i></div>'),
			down: $('<div class="icon"><i class="fa fa-thumbs-down"></i></div>'),
			info: $('<div class="icon"><i class="fa fa-info-circle"></i</div>>')
		};

		var amiright = function()
		{
			if ( !hash )  return;
			var theface = faces[hash];
			var name = ipt.val().toLowerCase().trim();

			var shortest = theface.Names[0];

			var rv = false;
			var i = 0;
			for ( ; i < theface.Names.length; i++ )
			{
				if ( theface.Names[i].toLowerCase().trim() === name )
					rv = true;
				if ( theface.Names[i].length < shortest.length )
					shortest = theface.Names[i];
			}

			$("#portrait .hi-my-name-is .name").text(shortest);
			$("#portrait .hi-my-name-is").show();

			this_round.splice(0,1);
			if ( rv )
			{
				correct++;
				update_score( "correct", correct );

				var msg = [
					FA.check.clone(),
					$("<strong />").text(theface.Names[0]),
					" is correct. "
				];
				if ( i > 0 )
				{
					msg.push( "<br />" );
					msg.push( $("<small />").text("You answered ").append($("<strong />").text(name)) );
				}

				flash_message( msg, "correct" );
				next_face();
			}
			else
			{
				remaining.push( hash )
				incorrect++;
				update_score( "incorrect", incorrect );

				var msg = [
					FA.down.clone(),
					$("<strong />").text(theface.Names[0]),
					" would have been better."
				];
				if ( name.trim().length > 0 )
				{
					msg.push( "<br />You entered: " );
					msg.push( $("<small />").text(name) );
				}
				flash_message( msg, "incorrect" );

				setTimeout( next_face, 2000 );
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
			{
				start_game( "right now" );
			}
			else
			{
				enter_stage( "welcome" );
				window.setTimeout(function()
				{
					$("#welcome button").focus();
				}, 200 );
			}
		}
	});

	$("#welcome button, #score button.again").click( start_game );
});

