var access_token;
var refresh_token;
var error;
var userInfo;
var songLength;
var currentSongPosition;
var barGraphic;
var visualiser;
var durations = [];
var beats = [];
var pitches = [];
var loudness = [];
var prevPitches = [];
let pause = true;

let index = 0;
let beatIndex = 0;
let nextBeatTime = 0;
let nextTime = 0;
let size = 0;

(function() {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */
	function getHashParams() {
		var hashParams = {};
		var e, r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1);
		while ( e = r.exec(q)) {
			hashParams[e[1]] = decodeURIComponent(e[2]);
		}
		return hashParams;
	}

	var userProfileSource = document.getElementById('user-profile-template').innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById('user-profile');

	var oauthSource = document.getElementById('oauth-template').innerHTML,
		oauthTemplate = Handlebars.compile(oauthSource),
		oauthPlaceholder = document.getElementById('oauth');

	var params = getHashParams();

	access_token = params.access_token;
	refresh_token = params.refresh_token;
	error = params.error;

	console.log(access_token + " " + refresh_token);

	if (error) {
		alert('There was an error during the authentication');
	} else {
	  	if (access_token) {
			// render oauth info
			oauthPlaceholder.innerHTML = oauthTemplate({
				access_token: access_token,
				refresh_token: refresh_token
			});

			let progressBar = document.getElementById("progress");
			let bar = document.createElement("canvas");
			bar.id = "bar";
			bar.width = window.innerWidth;
			bar.height = "15";
			progressBar.appendChild(bar);

			let ctx = bar.getContext("2d");
			ctx.fillStyle = "#FFFFFF";

			let visuals = document.getElementById("visualiser");
			let visualBars = document.createElement("canvas");
			visualBars.id = "visuals";
			visualBars.width = "300";
			visualBars.height = "300";
			visuals.appendChild(visualBars);

			$('#login').hide();
			$('#player-section').show();
			// $.ajax({
			// 	url: 'https://api.spotify.com/v1/me',
			// 	headers: {
			// 		'Authorization': 'Bearer ' + access_token
			// 	},
			// 	success: function(response) {
			// 		userProfilePlaceholder.innerHTML = userProfileTemplate(response);
			// 		userInfo = response;

			// 		$('#login').hide();
			// 		$('#loggedin').show();
			// 	}
			// });

			window.onresize = function() {
				bar.width = window.innerWidth;
				ctx.fillStyle = "#FFFFFF";
			}

			window.onSpotifyWebPlaybackSDKReady = () => {
				const player = new Spotify.Player({
					name: "Appl3 Visualiser",
					getOAuthToken: cb => { cb(access_token); },
					volume: 0.5
				});
			
				// Ready
				player.addListener('ready', ({ device_id }) => {
					console.log('Ready with Device ID', device_id);
					player.addListener('player_state_changed', ({
						position,
						duration,
						track_window: { current_track }
					}) => {
						let artist = "";
						console.log('Currently Playing', current_track);
						// console.log('Position in Song', position);
						// console.log('Duration of Song', duration);
						songLength = duration;
						currentSongPosition = position;

						$.ajax({
							url: "https://api.spotify.com/v1/audio-analysis/" + current_track.id,
							headers: {
								"Authorization": "Bearer " + access_token
							},
							success: function(response) {
								durations = [];
								beats = [];
								pitches = [];
								loudness = [];

								for (let i = 0; i < response.beats.length; i++) {
									beats.push(response.beats[i]);
								}
								for (let j = 0; j < response.segments.length; j++) {
									durations.push(response.segments[j].duration);
									pitches.push(response.segments[j].pitches);
									loudness.push(response.segments[j].loudness_max);
								}
								// console.log(durations);
								// console.log(beats);
								// console.log(pitches);
								// console.log(loudness);

								checkSegmentIndex();
								checkBeatIndex();
							}
						});
						nextTime = 0;
						nextBeatTime = 0;

						document.getElementById("background").style.backgroundImage = "url(" + current_track.album.images[0].url + ")";
						document.getElementById("cover").src = current_track.album.images[0].url;
						document.getElementById("name").innerHTML = current_track.name;
			
						for (let i = 0; i < current_track.artists.length; i++) {
							let artistID = current_track.artists[i].uri.replace("spotify:artist:", "");
							if (i == current_track.artists.length - 1) {
								artist += "<span onclick='getArtist(`" + artistID + "`);'>" + current_track.artists[i].name + "</span>";
							} else {
								artist += "<span onclick='getArtist(`" + artistID + "`);'>" + current_track.artists[i].name + ",&nbsp;</span>";
							}
						}
			
						document.getElementById("artist").innerHTML = artist.trim();
					});
				});
			
				// Not Ready
				player.addListener('not_ready', ({ device_id }) => {
					console.log('Device ID has gone offline', device_id);
				});
			
				player.addListener('initialization_error', ({ message }) => {
					console.error(message);
				});
			
				player.addListener('authentication_error', ({ message }) => {
					console.error(message);
				});
			
				player.addListener('account_error', ({ message }) => {
					console.error(message);
				});
			
				document.getElementById('togglePlay').onclick = function() {
					player.getCurrentState().then(state => {
						if (state.paused) {
							clearInterval(barGraphic);
							barGraphic = setInterval(() => {
								let t = (currentSongPosition / songLength) * bar.width;
								ctx.shadowBlur = 7;
								ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
								ctx.shadowOffsetX = 4;
								ctx.shadowOffsetY = 2;
								ctx.clearRect(0, 0, bar.width, bar.height);
								ctx.fillRect(0, 0, t, 15);
								currentSongPosition += 10;
							}, 10);
							pause = false;
							document.getElementById("togglePlay").innerHTML = "Pause";
							requestAnimationFrame(animate);
							requestAnimationFrame(animateBeats);
						} else {
							clearInterval(barGraphic);
							document.getElementById("togglePlay").innerHTML = "Play";
							pause = true;
						}
						player.togglePlay();
						checkSegmentIndex();
						checkBeatIndex();
					});
				};
			
				player.connect();
			}

			function animate(currentTime) {
				if (pause) return;
				if (currentSongPosition < nextTime) {
					if (index >= 0) {
						let x = 0;
						const clear = visualBars.getContext("2d");
						clear.clearRect(0, 0, visualBars.width, visualBars.height);
						for (let k = 0; k < pitches[index].length; k++) {
							if (prevPitches[k] == null) {
								prevPitches[k] = (pitches[index - 1][k]);
							}
							let diff = pitches[index][k] - prevPitches[k];
							if (diff > 0) {
								prevPitches[k] += (0.05 * prevPitches[k]);
							} else {
								prevPitches[k] -= (0.1 * prevPitches[k]);
							}

							let ctx = visualBars.getContext("2d");
							ctx.fillStyle = "rgba(255, 255, 255, 1)";
							ctx.shadowBlur = 7;
							ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
							ctx.shadowOffsetX = 4;
							ctx.shadowOffsetY = 2;
							ctx.beginPath();
							ctx.fillRect(x, 290, 12, -prevPitches[k] * 100);
							x += 17;
						}
					}
					requestAnimationFrame(animate);
					return;
				}
				nextTime = currentSongPosition + (durations[index] * 1000);
				if (index < durations.length - 1) {
					for (let l = 0; l < pitches[index].length; l++) {
						prevPitches[l] = pitches[index][l];
					}
					index++;
				} else {
					index = 0;
				}
				requestAnimationFrame(animate);
			}

			const sleep = ms => new Promise(r => setTimeout(r, ms));

			function animateBeats() {
				if (pause) return;
				// console.log(loudness[index]);
				if (loudness[index] < -10) {
					requestAnimationFrame(animateBeats);
					return;
				}
				if (currentSongPosition < nextBeatTime) {
					document.getElementById("scale").className = "";
					requestAnimationFrame(animateBeats);
					return;
				}
				document.getElementById("scale").className = "pump";
				sleep(100).then(() => {
					nextBeatTime = currentSongPosition + (beats[beatIndex].duration * 1000) - 100;
					if (beatIndex < beats.length - 1) {
						beatIndex++;
					} else {
						beatIndex = 0;
					}
					requestAnimationFrame(animateBeats);
				});
			}

			function checkSegmentIndex() {
				let timeElapsed = 0;
				for (let i = 0; i < durations.length; i++) {
					if (timeElapsed >= (currentSongPosition / 1000)) {
						index = i;
						// console.log("New index: " + index);
						return;
					}
					timeElapsed += durations[i];
				}
			}

			function checkBeatIndex() {
				let timeElapsed = 0;
				for (let i = 0; i < beats.length; i++) {
					if (timeElapsed >= (currentSongPosition / 1000)) {
						beatIndex = i;
							// console.log("New beat index: " + beatIndex);
						return;
					}
					timeElapsed += beats[i].duration;
				}
				beatIndex = 0;
			}
		} else {
			// render initial screen
			$('#login').show();
			$('#player-section').hide();
			$('#loggedin').hide();
		}

		document.getElementById('obtain-new-token').addEventListener('click', function() {
			$.ajax({
				url: '/refresh_token',
				data: {
					'refresh_token': refresh_token
				}
			}).done(function(data) {
				access_token = data.access_token;
				oauthPlaceholder.innerHTML = oauthTemplate({
					access_token: access_token,
					refresh_token: refresh_token
				});
			});
		}, false);
	}
})();