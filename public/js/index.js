let playbackButton = document.getElementById("togglePlay");
let artistInfoPanel = document.getElementById("artist-info");
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
    //container.className = "hide-3";
    setTimeout(() => {
        $.ajax({
            url: "https://api.spotify.com/v1/artists/" + id,
            headers: {
                "Authorization": "Bearer " + access_token
            },
            success: function(response) {
                let exitButton = document.getElementById("exitArtist");
                let artistImg = document.getElementById("artistImg");
                let artistName = document.getElementById("artistName");
                let followers = document.getElementById("followers");
                let topGenre = document.getElementById("topGenre");
                let popularity = document.getElementById("popularity");
    
                let followersText = response.followers.total;
                let topGenreText = response.genres[0];
                let popularityText = response.popularity;
    
                if (topGenreText == "undefined") { topGenreText = "None" ;}
    
                container.className = "";
                exitButton.onclick = function() {
                    container.className = "hide-2";
                }
                artistImg.src = response.images[0].url;
                artistName.textContent = response.name;
                followers.innerHTML = "Followers<br><span class='boldInfo'>" + followersText.toLocaleString("en-US") + "</span>";
                topGenre.innerHTML = "Top Genre<br><span class='boldInfo'>" + topGenreText + "</span>";
                popularity.innerHTML = "Popularity<br><span id='popularityColour' class='boldInfo'>" + popularityText + "</span>";
    
                calculatePopularityColour(response.popularity);
                getRelatedArtists(id);
            }
        });
    }, 380);
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

            for (let i = 0; i < 3; i++) {
                let artist = response.artists[i];
                let cont = document.createElement("div");
                let image = document.createElement("img");
                let name = document.createElement("p");

                cont.onclick = function() {
                    artistInfoPanel.className = "hide-3";
                    getArtist(artist.id);
                }
                image.src = artist.images[0].url;
                image.width = "75";
                image.height = "75";
                name.textContent = artist.name;

                cont.appendChild(image);
                cont.appendChild(name);
                container.appendChild(cont);
            }
        }
    });
}

function calculatePopularityColour(value) {
    let colour = document.getElementById("popularityColour");
    switch(true) {
        case (value < 20):
            colour.style.color = "#a83232";
            break;
        case (value < 40):
            colour.style.color = "#db9121";
            break;
        case (value < 60):
            colour.style.color = "#edc647";
            break;
        case (value < 80):
            colour.style.color = "#99cf36";
            break;
        default:
            colour.style.color = "#32a850";
            break;
    }
}