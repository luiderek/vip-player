let parser = new DOMParser();

let xhr = new XMLHttpRequest();
let trackObject;
let currentTrackIndex = 1;

xhr.open('GET', 'https://vip.aersia.net/roster-mellow.xml');
xhr.onreadystatechange = function () {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    let status = xhr.status;
    if (status === 0 || (status >= 200 && status < 400)) {
      xmlMellow = xhr.responseText;
      xmlParsed = parser.parseFromString(xmlMellow, "text/xml");
      let tracklist = xmlParsed.children[0].children[0].children;
      trackObject = tracklistObject(tracklist);
      for (let track of trackObject) {
        appendTrackToList(track);
      }
    } else {
      console.error('There was a mistake with XHR of the track list');
    }
  }
}
xhr.send();

const $trackList = document.querySelector('.track-list');

function tracklistObject(trackHTMLCollection) {
  let result = [];
  let next_id = 0;
  for (let track of trackHTMLCollection) {
    result.push({
      author: track.children[0].textContent,
      name: track.children[1].textContent,
      link: track.children[2].textContent,
      id: ++next_id
    })
  }
  return result;
}

function appendTrackToList(track) {
  let $div = document.createElement('div');
  $div.className = `track t-${track.id}`;
  if (track.name.includes(' - ')) {
    $div.textContent = track.name.split(' - ').slice(1).join('-')
  } else {
    $div.textContent = track.name;
  }

  //;
  // [0] author [1] trackname [2] resource link
  $trackList.appendChild($div);
}

let $audio = document.querySelector('#audio');
let volume = .5;
$audio.volume = volume;

let $nowPlaying = document.querySelector('.now-playing');

$trackList.addEventListener('click', function (event) {
  // The check is in case people click and drag the list, for some reason.
  if (event.target.className !== 'track-list') {
    changeSelectedTrack(event.target);
    let selected_id = event.target.classList[1].split('-')[1];
    currentTrackIndex = selected_id-1;
    $audio.setAttribute('src', trackObject[currentTrackIndex].link);
    play();
  }
});

let $controls = document.querySelector('.controls');
let $btnPlay = document.querySelector('.lucide-play');
let $btnPause = document.querySelector('.lucide-pause');

$controls.addEventListener('click', function (event) {
  let targetclass = event.target.className;
  let checks = ['controls', 'volume-slider', 'timer']
  if (!checks.includes(targetclass)) {
    let target = event.target.closest('svg');
    let type = target.classList[1].split('-').slice(1).join('-');
    switch (type) {
      case 'pause':
        pause(); break;
      case 'play':
        play(); break;
      case 'volume-1': case 'volume-x':
        toggleMute(); break;
      case 'skip-forward':
        playNextTrack(); break;
    }
  }
});

function pause() {
  $audio.pause();
  $btnPlay.classList.remove('hidden');
  $btnPause.classList.add('hidden');
}

function play() {
  $audio.play();
  $btnPlay.classList.add('hidden');
  $btnPause.classList.remove('hidden');
}

const $volumeUnMuted = document.querySelector('.lucide-volume-1');
const $volumeMuted = document.querySelector('.lucide-volume-x');
function toggleMute() {
  if ($volumeMuted.classList.contains('hidden')) {
    $audio.volume = 0;
  } else {
    $audio.volume = volume;
  }
  $volumeMuted.classList.toggle('hidden');
  $volumeUnMuted.classList.toggle('hidden');
}

function changeSelectedTrack(target) {
  $prev_selected = document.querySelector('.selected-track')
  if ($prev_selected) {
    $prev_selected.classList.remove('selected-track');
  }
  target.classList.add('selected-track');
  $nowPlaying.textContent = `${trackObject[currentTrackIndex].author} - ${trackObject[currentTrackIndex].name}`;
}

const $volumeSlider = document.querySelector('.volume-slider');
$volumeSlider.addEventListener('change', function (event) {
  volume = event.target.value / 100
  if ($volumeMuted.classList.contains('hidden')) {
    $audio.volume = volume;
  }
});

const $timer = document.querySelector('.timer');
$audio.ontimeupdate = () => {
  $timer.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
};

$audio.onended = () => {
  playNextTrack();
}

function playNextTrack() {
  currentTrackIndex++;
  $audio.setAttribute('src', trackObject[currentTrackIndex].link);
  play();
  let $newTrack = document.querySelector(`.t-${currentTrackIndex+1}`);
  changeSelectedTrack($newTrack);
}

function formatTime(seconds) {
  seconds = ~~seconds;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(a => a)
    .join(':')
}

// If hitting play while the page just loaded, it should load up the next song.
