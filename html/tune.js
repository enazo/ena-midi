
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var audioBuffers = {};


const notes = [
	{
		"name": "do",
		"key": "1",
		"filename": "200-do"
	},
	{
		"name": "re",
		"key": "2",
		"filename": "201-re"
	},
	{
		"name": "mi",
		"key": "3",
		"filename": "202-mi"
	},
	{
		"name": "fa",
		"key": "4",
		"filename": "203-fa"
	},
	{
		"name": "so",
		"key": "5",
		"filename": "204-so"
	},
	{
		"name": "ra",
		"key": "6",
		"filename": "205-ra"
	},
	{
		"name": "shi",
		"key": "7",
		"filename": "206-shi"
	},
	{
		"name": "do",
		"key": "8",
		"filename": "207-do"
	}
];

const keyToNote = notes.reduce(function (map, note) {
	map[note.key] = note;
	return map;
}, {});

const filenameToURL = filename => '/kitsu/' + filename + '.m4a';


notes.forEach(function (note) {
	const { name, filename } = note;
	const el = document.createElement('button');
	el.textContent = name;
	el.addEventListener('click', function () {
		playSound(note);
	});
	document.body.appendChild(el);
	fetch(filenameToURL(filename))
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
		.then(audioBuffer => {
			note.buffer = audioBuffer;
		});
});


function playSound(note, loop, filter) {
	var source = audioContext.createBufferSource();
	source.buffer = note.buffer;
	source.loop = loop;

	if (filter) {
		// 创建一个低通滤波器
		var biquadFilter = audioContext.createBiquadFilter();
		biquadFilter.type = 'lowshelf';
		biquadFilter.frequency.value = 200;
		biquadFilter.gain.value = 25;
		source.connect(biquadFilter);
		biquadFilter.connect(audioContext.destination);
	} else {
		// 直接连接到音频输出
		source.connect(audioContext.destination);
	}

	source.start();
}

// 最小播放间隔时间
const minInterval = 210;
let lastPlayed = 0;
window.addEventListener('keydown', function (event) {
	var note = keyToNote[event.key];
	if (!note) return;

	const now = +Date.now();

	console.log(note.lastPlayed);
	if (
		note.lastPlayed
		&&
		(now - note.lastPlayed) < minInterval
	) return;

	note.lastPlayed = now;

	playSound(note, loopSwitch.checked, filterSwitch.checked);
});
