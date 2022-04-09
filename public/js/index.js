let playbackButton = document.getElementById("togglePlay");
let timeout;

window.addEventListener("load", function() {
    playbackButton.className = "hide";
});

window.addEventListener("mousemove", function() {
    this.clearTimeout(timeout);
    playbackButton.className = "";
    timeout = this.setTimeout(() => {
        playbackButton.className = "hide";
    }, 4000);
});

function getArtist(id) {
    let container = document.getElementById("artist-info");
    $.ajax({
        url: "https://api.spotify.com/v1/artists/" + id,
        headers: {
            "Authorization": "Bearer " + access_token
        },
        success: function(response) {
            //console.log(response);
            let exitButton = document.getElementById("exitArtist");
            let artistImg = document.getElementById("artistImg");
            let artistName = document.getElementById("artistName");
            let followers = document.getElementById("followers");
            let topGenre = document.getElementById("topGenre");

            let followersText = response.followers.total;
            let topGenreText = response.genres[0];
            if (topGenreText == "undefined") { topGenreText = "None" ;}

            container.className = "";
            exitButton.onclick = function() {
                container.className = "hide";
            }
            artistImg.src = response.images[0].url;
            artistName.textContent = response.name;
            followers.innerHTML = "Followers<br><span class='boldInfo'>" + followersText.toLocaleString("en-US") + "</span>";
            topGenre.innerHTML = "Top Genre<br><span class='boldInfo'>" + topGenreText + "</span>";

            getRelatedArtists(id);
        }
    });
}

function getRelatedArtists(id) {
    let container = document.getElementById("moreArtists");
    $.ajax({
        url: "https://api.spotify.com/v1/artists/" + id + "/related-artists",
        headers: {
            "Authorization": "Bearer " + access_token
        },
        success: function(response) {
            container.innerHTML = "Related Artists<br>";

            for (let i = 0; i < 5; i++) {
                let artist = response.artists[i];
                let cont = document.createElement("div");
                let span = document.createElement("span");
                let image = document.createElement("img");
                //let name = document.createElement("p");

                span.onclick = function() {
                    getArtist(artist.id);
                }
                image.src = artist.images[0].url;
                image.width = "75";
                image.height = "75";
                //name.textContent = artist.name;

                span.appendChild(image);
                //span.appendChild(name);
                cont.appendChild(span);
                container.appendChild(cont);
            }
        }
    });
}