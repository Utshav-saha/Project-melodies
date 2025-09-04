let currentSong = new Audio();
let allPlaylists = []; // Will hold data from playlists.json
let currentQueue = []; // The current playing queue

// --- Loads all playlist data from the manifest file ---
async function loadAndDisplayPlaylists() {
    try {
        const response = await fetch("songs/playlists.json"); // Relative path
        allPlaylists = await response.json();

        const cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = ""; // Clear existing cards

        for (const playlist of allPlaylists) {
            cardContainer.innerHTML += `
                <div data-folder="${playlist.folder}" class="card">
                    <div class="play">
                        <img src="play-button.png" alt="">
                    </div>
                    <img src="${playlist.cover_path}" alt="Cover for ${playlist.title}">
                    <h2>${playlist.title}</h2>
                    <p>${playlist.artist}</p>
                </div>`;
        }
    } catch (error) {
        console.error("Failed to load or parse playlists.json:", error);
    }
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

// Converts seconds to a 'minutes:seconds' format.
function secondsToMinutesSeconds(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function main() {
    // 1. Load all playlists from the JSON and display the cards
    await loadAndDisplayPlaylists();

    // 2. Initial setup: load the first playlist from our manifest into the queue
    if (allPlaylists.length > 0) {
        const firstPlaylist = allPlaylists[0];
        // **FIX 1:** REMOVED encodeURIComponent to store normal paths with spaces.
        const initialSongs = firstPlaylist.songs.map(songFile => `songs/${firstPlaylist.folder}/${songFile}`);
        currentQueue.push(...initialSongs);
        appendSongsToDisplay(initialSongs);
        playMusic(currentQueue[0], true);
    }

    // Play/pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.png";
        } else {
            currentSong.pause();
            play.src = "play.png";
        }
    });
    
    // Playlist card click listener
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", item => {
            const folderName = item.currentTarget.dataset.folder;
            const clickedPlaylist = allPlaylists.find(p => p.folder === folderName);

            if (clickedPlaylist) {
                // **FIX 1:** REMOVED encodeURIComponent here as well.
                const newSongs = clickedPlaylist.songs.map(songFile => `songs/${folderName}/${songFile}`);
                const isAlreadyAdded = newSongs.every(song => currentQueue.includes(song));

                if (!isAlreadyAdded) {
                    currentQueue.push(...newSongs);
                    appendSongsToDisplay(newSongs);
                }
            }
        });
    });

    // Time update listener
    currentSong.addEventListener("timeupdate", () => {
        if (currentSong.duration) {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Seekbar listener
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Previous button listener
    previous.addEventListener("click", () => {
        // **FIX 2:** Decode the browser's URL before comparing.
        const currentSrcDecoded = decodeURIComponent(currentSong.src);
        let currentIndex = currentQueue.findIndex(song => currentSrcDecoded.endsWith(song));
        
        if (currentIndex !== -1) {
            let previousIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
            playMusic(currentQueue[previousIndex]);
        }
    });

    // Next button listener
    next.addEventListener("click", () => {
        // **FIX 2:** Decode the browser's URL before comparing.
        const currentSrcDecoded = decodeURIComponent(currentSong.src);
        let currentIndex = currentQueue.findIndex(song => currentSrcDecoded.endsWith(song));
        
        if (currentIndex !== -1) {
            let nextIndex = (currentIndex + 1) % currentQueue.length;
            playMusic(currentQueue[nextIndex]);
        }
    });

    // Volume control listener
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100;
    });
}

main();