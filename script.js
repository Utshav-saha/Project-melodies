let currentSong = new Audio();
let songs = []; // Initialize as an empty array to accumulate songs
let currFolder;

// Fetches a list of song URLs from a specified folder on the server.
async function getSongs(folder) {
    currFolder = folder;
    console.log(folder);
    let a = await fetch(`http://localhost:8000/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    const anchors = div.getElementsByTagName("a");
    let fetchedSongs = [];

    const base = `${location.origin}/${folder}/`;

    for (const a of anchors) {
        const href = a.getAttribute('href');
        if (href.endsWith(".mp3")) {
            const fileName = href.split('/').pop();
            const link = base + fileName;
            fetchedSongs.push(link);
        }
    }
    return fetchedSongs;
}

// Appends new songs to the UI and attaches event listeners.
function appendSongsToDisplay(songsToAdd) {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];

    for (const song of songsToAdd) {
        let songName = decodeURIComponent(song.split('/').pop()).replaceAll(".mp3", "");

        let li = document.createElement('li');
        li.innerHTML = ` 
            <img src="music.svg" alt="">
            <div class="info">
                <div>${songName}</div>
                <div>Harry</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img src="play_now.svg" alt="">
            </div>`;

        li.addEventListener("click", () => {
            playMusic(song);
        });

        songUL.appendChild(li);
    }
}

// Converts seconds to a 'minutes:seconds' format.
function secondsToMinutesSeconds(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Loads and plays a music track.
const playMusic = (track, pause = false) => {
    currentSong.src = track;

    if (!pause) {
        currentSong.play();
        play.src = "pause.png";
    }

    let songName = decodeURIComponent(track.split('/').pop()).replaceAll(".mp3", "");
    document.querySelector(".songinfo").innerHTML = songName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displaySongs() {
    let a = await fetch(`http://localhost:8000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    // console.log(div);

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors)

    for (let index = 0; index < array.length; index++) {

        const e = array[index];

        if (e.href.endsWith("/")) {
            let folder = (e.href.split("/").slice(-2)[0]);

            // Get metadata of folder
            let a = await fetch(`http://localhost:8000/songs/${folder}/info.json`);
            let response = await a.json();
            console.log(response);
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card spotifyPlaylists">
                        <div class="play">
                            <img src="play-button.png" alt="">
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.Title}</h2>
                        <p>${response.Artist}</p>
                    </div>`
        
        }

    }

    // console.log(e.href);

    // Add event listener to load and APPEND a new playlist from a card click
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let newSongs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            console.log(newSongs);

            const isAlreadyAdded = songs.some(song => newSongs.includes(song));

            if (!isAlreadyAdded) {
                songs.push(...newSongs);
                appendSongsToDisplay(newSongs);
            }
        });
    });

}
async function main() {
    // Initial setup on page load
    let initialSongs = await getSongs("songs/Husn");
    songs.push(...initialSongs);
    appendSongsToDisplay(initialSongs);
    playMusic(songs[0], true);

    // Display all the songs on page
    displaySongs();


    // Attach an event listener to play/pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.png";
        } else {
            currentSong.pause();
            play.src = "play.png";
        }
    });

    // Listener for song time updates
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 95 + "%";
    });

    // Add an event Listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Add an event Listener to previous button
    previous.addEventListener("click", () => {

        const currentSrcDecoded = decodeURIComponent(currentSong.src);
        let currentIndex = songs.findIndex(song => decodeURIComponent(song) === currentSrcDecoded);

        if (currentIndex !== -1) {
            let previousIndex = (currentIndex - 1 + songs.length) % songs.length;
            playMusic(songs[previousIndex]);
        }
    });

    // Add an event Listener to next button
    next.addEventListener("click", () => {

        const currentSrcDecoded = decodeURIComponent(currentSong.src);
        let currentIndex = songs.findIndex(song => decodeURIComponent(song) === currentSrcDecoded);

        if (currentIndex !== -1) {
            let nextIndex = (currentIndex + 1) % songs.length;
            playMusic(songs[nextIndex]);
        }
    });

    // Add an event to volume control
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100;
    });


}

main();