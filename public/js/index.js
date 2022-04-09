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
    $.ajax({
        url: "https://api.spotify.com/v1/artists/" + id,
        headers: {
            "Authorization": "Bearer " + access_token
        },
        success: function(response) {
            console.log(response);
        }
    });
}