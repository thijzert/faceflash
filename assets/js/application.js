
(function()
{
	var requestAnimation = (function() {
		var t0 = null;
		var animations = [];

		var cont = function(t)
		{
			for ( let i = 0; i < animations.length; i++ )
			{
				let anim = animations[i];
				if ( anim.start === null )  anim.start = t;
				let p = (t - anim.start) / anim.duration;
				if ( p < 0 ) p = 0;
				if ( p > 1 ) p = 1;
				anim.exec( p );
			}
			t0 = t;

			for ( let i = animations.length - 1; i >= 0; i-- )
			{
				let anim = animations[i];
				if ( t > (anim.start + anim.duration) )
				{
					if ( typeof(anim.onComplete) == "function" )
					{
						anim.onComplete();
					}
					animations.splice( i, 1 );
				}
			}

			requestAnimationFrame( cont );
		};
		requestAnimationFrame( cont );

		return (function( execFunction, duration, onComplete )
		{
			if ( typeof(execFunction) != "function" )
			{
				return;
			}

			duration = parseFloat(duration);
			if ( duration < 1 )
			{
				duration = 500;
			}

			animations.push({
				start: t0,
				duration: duration,
				exec: execFunction,
				onComplete: onComplete
			});

			execFunction(0);
		});
	})();
	var cssAnimate = (function()
	{
		// Sinusoidal easing
		var ease = function( from, to, scale )
		{
			if ( scale <= 0 )  return from;
			if ( scale >= 1 )  return to;

			return from + (Math.cos((1+scale)*Math.PI)) * (to - from);
		};

		var unitR = /^(.*)(cm|mm|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/;

		return function( node, css, duration, callback )
		{
			var comp = window.getComputedStyle( node );
			var before = {};
			var after = {};
			var units = {};
			for ( k in css )
			{
				if ( !css.hasOwnProperty(k) )  continue;

				before[k] = parseFloat(comp[k]);

				let mm = unitR.exec(css[k]);
				if ( mm )
				{
					after[k] = parseFloat(mm[1]);
					units[k] = mm[2];
				}
				else
				{
					after[k] = parseFloat(css[k]);
					units[k] = "";
				}
			}
			var twn = function( t )
			{
				for ( k in css )
				{
					if ( !css.hasOwnProperty(k) )  continue;
					node.style[k] = ease( before[k], after[k], t ) + units[k];
				}
			};
			requestAnimation( twn, duration, callback );
		};
	})();
	var fadeOut = function( node, duration, callback )
	{
		node.style.display = "block"; // FIXME: detect inline elements.
		cssAnimate( node, { opacity: 0.0 }, duration, function()
		{
			node.style.display = "none";
			if ( typeof(callback) == "function" )
			{
				callback();
			}
		} );
	};
	var fadeIn = function( node, duration, callback )
	{
		node.style.opacity = 0.0;
		node.style.display = "block"; // FIXME: detect inline elements.
		cssAnimate( node, { opacity: 1.0 }, duration, function()
		{
			node.style.display = "block"; // See above
			if ( typeof(callback) == "function" )
			{
				callback();
			}
		} );
	};

	var tag = function( tagname, text )
	{
		let rv = document.createElement(tagname);
		rv.appendChild( document.createTextNode(text) );
		return rv;
	};
	var ap = function( target )
	{
		for ( let i = 1; i < arguments.length; i++ )
		{
			if ( typeof(arguments[i]) == "string" )
			{
				target.appendChild( document.createTextNode(arguments[i]) );
			}
			else
			{
				target.appendChild( arguments[i] );
			}
		}
		return target;
	};

	var duration = function( t0, t1 )
	{
		let d = Math.round( (t1 - t0)/1000 );
		let s = d % 60;
		let m = Math.floor( d / 60 ) % 60;
		let h = Math.floor( d / 3600 );

		let f = (x) => ( x < 10 ? "0" + x : x );

		if ( h )
		{
			return f(h) + ":" + f(m) + ":" + f(s);
		}

		return f(m) + ":" + f(s);
	};

	var faces = null;

	document.getElementById("faceflash").classList.toggle( "loading", true );

	var update_score = function( key, val )
	{
		let sc = document.querySelectorAll( ".scoreboard .score-" + key )
		for ( s of sc )
			s.innerText = val;
	};

	var enter_stage = function()
	{
		var stages = {
			welcome:   document.querySelector("#faceflash > div#welcome"),
			countdown: document.querySelector("#faceflash > div#countdown"),
			game:      document.querySelector("#faceflash > div#game"),
			score:     document.querySelector("#faceflash > div#score")
		}

		return function( stage )
		{
			if ( !stages[stage] )  return;

			for ( k in stages )
			{
				if ( !stages.hasOwnProperty(k) )  continue;
				if ( k == stage )  continue;
				if ( !stages[k] )  continue;
				if ( stages[k].style.display != "none" )
				{
					fadeOut( stages[k], 300 );
				}
			}
			fadeIn( stages[stage], 400 );
		}
	}();

	var start_game = function()
	{
		var flash_container = document.querySelector("#game #flash_container");
		var flash_message = function( message, cls )
		{
			var P = document.createElement("P");
			P.classList.add( cls );
			if ( typeof(message) == "string" )
			{
				P.innerHTML = message;
			}
			else if ( message.length )
			{
				for ( let i = 0; i < message.length; i++ )
				{
					if ( typeof(message[i]) == "string" )
					{
						P.appendChild(document.createTextNode(message[i]));
					}
					else if ( message[i].nodeName )
					{
						P.appendChild(message[i]);
					}
					else if ( message[i].hasOwnProperty("length") && message[i].domManip )
					{
						for ( let j = 0; j < message[i].length; j++ )
						{
							P.appendChild(message[i][j]);
						}
					}
					else
					{
						P.appendChild(document.createTextNode(JSON.stringify(message[i])));
					}
				}
			}

			flash_container.insertBefore( P, flash_container.firstChild );

			setTimeout( function()
			{
				fadeOut( P, 4000, function()
				{
					flash_container.removeChild(P);
				});
			}, 4000 );
		};

		var Countdown = {
			timeout: 1000,
			overlap:  800,
			container: document.querySelector("#game > div#countdown"),
			blip: function( num, callback )
			{
				return function()
				{
					var N = document.createElement("SPAN");
					N.innerHTML = num;
					Countdown.container.insertBefore( N, Countdown.container.firstChild );
					let d = Countdown.timeout + Countdown.overlap;
					let s = { fontSize: "200px", opacity: 0.0 };
					let cb = function() {
						Countdown.container.removeChild(N);
					};
					cssAnimate( N, s, d, cb );

					window.setTimeout( num == 1 ? callback : Countdown.blip( num - 1, callback ), Countdown.timeout )
				}
			}
		};

		var shuffle_array = function(o)
		{
			for ( var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		};

		var ipt = document.querySelector("#game #form input");
		var hash = null;
		var tStart = null;
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
			document.querySelector("#portrait .hi-my-name-is").style.display = "none";
			document.querySelector("#portrait .hi-my-name-is .name").innerText = "";

			if ( this_round.length == 0 )
			{
				if ( remaining.length == 0 )
				{
					update_score( "total-time", duration( tStart, new Date() ) );
					enter_stage( "score" );
					return;
				}
				next_round();
			}
			update_score( "remaining", this_round.length + remaining.length );

			hash = this_round[0];
			document.querySelector("#game #portrait img").src = "face/" + hash;
			ipt.value = '';
			ipt.focus();
		};

		var FA = {
			_construct: function(icon)
			{
				return function()
				{
					let rv = document.createElement("DIV");
					rv.classList.toggle("icon",true);
					rv.innerHTML = "<i class=\"fa " + icon + "\"></i>";
					return rv;
				};
			}
		};
		FA.check = FA._construct('fa-check');
		FA.down = FA._construct('fa-thumbs-down');
		FA.info = FA._construct('fa-info-circle');

		var amiright = function()
		{
			if ( !hash )  return;
			var theface = faces[hash];
			var name = ipt.value.toLowerCase().trim();

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

			document.querySelector("#portrait .hi-my-name-is .name").innerText = shortest;
			document.querySelector("#portrait .hi-my-name-is").style.display = "block";

			this_round.splice(0,1);
			if ( rv )
			{
				correct++;
				update_score( "correct", correct );

				var msg = [
					FA.check(),
					tag( "STRONG", theface.Names[0] ),
					" is correct. "
				];
				if ( i > 0 )
				{
					msg.push( document.createElement("BR") );
					msg.push( ap( tag( "SMALL", "You answered " ), tag( "STRONG", name ) ) );
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
					FA.down(),
					tag( "STRONG", theface.Names[0] ),
					" would have been better."
				];
				if ( name.trim().length > 0 )
				{
					msg.push( document.createElement("BR") );
					msg.push( "You entered: " );
					msg.push( tag( "SMALL", name ) );
				}
				flash_message( msg, "incorrect" );

				setTimeout( next_face, 2000 );
				hash = null;
			}
		};

		ipt.addEventListener( "keyup", function( e )
		{
			if ( e.which != 13 )  return true;
			amiright();
			return false;
		});



		var actual_game = function()
		{
			console.log( "The game is afoot, dear Watson." );

			tStart = new Date();
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

	fetch("faces.json")
		.then(async function( response )
		{
			faces = await response.json();
			document.querySelector("#faceflash").classList.toggle( "loading", false );

			// For debugging purposes: 
			if ( location.hash === "#skip-to-the-game" )
			{
				start_game( "right now" );
			}
			else if ( location.hash === "#start-in-5" )
			{
				start_game();
			}
			else
			{
				enter_stage( "welcome" );
				window.setTimeout(function()
				{
					document.querySelector("#welcome button").focus();
				}, 200 );
			}
		});

	document.querySelector("#score button.again").addEventListener( "click", start_game );
	document.querySelector("#welcome button").addEventListener( "click", start_game );
})();

