class Tune {
	constructor(config) {

		this.config = config;

		const { 

			tunes, 
			appEl,
			appWidth, appHeight, 
			minInterval,
		} = config;


		this.appWidth = appWidth;
		this.appHeight = appHeight;
		this.tuneWidth = appWidth / 3;

		this.minInterval = minInterval || 200;

		
		this.appEl = appEl;
		this.canvas = document.createElement('canvas');
		this.canvas.width = appWidth;
		this.canvas.height = appHeight;
		appEl.querySelector('.tunes').appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillStyle = 'black';

		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";

		this.ctx.font = 'bold 30px sans-serif';
		this.ctx.fillStyle = 'black';

		this.audioContext = new (window.AudioContext || window.webkitAudioContext)();


		const keyToTune = tunes.reduce( (map, tune) => {
			map[tune.key] = tune;
			return map;
		}, {});

		this.tunes = tunes;


		window.addEventListener('keydown', event => {
			var tune = keyToTune[event.key];
			if (!tune) return;

			const now = +Date.now();

			console.log(tune.lastPlayed);
			if (
				tune.lastPlayed
				&&
				(now - tune.lastPlayed) < this.minInterval
			) return;

			tune.lastPlayed = now;

			this.playSound(tune, loopSwitch.checked, filterSwitch.checked);
		});


		this.canvas.addEventListener('click', e => {
			e.preventDefault();

			const x = e.offsetX;
			const y = e.offsetY;

			const index = Math.floor(x / this.tuneWidth) + Math.floor(y / this.tuneWidth) * 3;
			const tune = this.tunes[index];

			if(!tune) return;

			this.playSound(tune, loopSwitch.checked, filterSwitch.checked);
		});
		// this.canvas.addEventListener('contextmenu', e => e.preventDefault());
		this.canvas.addEventListener('mousedown', e => e.preventDefault());
		// this.canvas.addEventListener('mouseup', e => e.preventDefault());

		tunes.forEach( tune => {
			const { name, filename } = tune;

			tune.sources = [];
			
			fetch(this.filenameToURL(filename))
				.then(response => response.arrayBuffer())
				.then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
				.then(audioBuffer => {
					tune.buffer = audioBuffer;
				});
		});

		this.drawCanvas();
	}

	drawCanvas(){
		const { appWidth, appHeight,  } = this.config;
		this.ctx.clearRect(0, 0, appWidth, appHeight);
		
		const { tuneWidth } = this;
		this.tunes.forEach( (tune, index) => {
			const x = (index % 3) * tuneWidth;
			const y = Math.floor(index/3) * tuneWidth;



			const active = tune.sources.length > 0;
			if(active){

				const lastSource = tune.sources[tune.sources.length - 1];
				// 获取当前播放源 播放进度
				const { currentTime } = this.audioContext;
				const duration = lastSource.buffer.duration;


				// todo 这里还要记录下当前 source 开始播放时间，减去当前时间，算出当前播放进度
				console.log('duration', lastSource.buffer.duration);

				this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
				this.ctx.fillRect(x, y, tuneWidth, tuneWidth);
			}

			this.ctx.fillStyle = 'black';
			this.ctx.fillText(
				tune.name, 
				x + tuneWidth / 2, 
				y + tuneWidth / 2, 
			);
		});

		// 绘制 Loop 按钮

		// 绘制 Filter 按钮

	}

	filenameToURL (filename) {
		return '/kitsu/' + filename + '.m4a';
	}

	playSound (tune, loop, filter) {
		var source = this.audioContext.createBufferSource();
		source.buffer = tune.buffer;
		// source.loop = loop;
	
		if (filter) {
			// 创建一个低通滤波器
			var biquadFilter = this.audioContext.createBiquadFilter();
			biquadFilter.type = 'lowshelf';
			biquadFilter.frequency.value = 200;
			biquadFilter.gain.value = 25;
			source.connect(biquadFilter);
			biquadFilter.connect(this.audioContext.destination);
		} else {
			// 直接连接到音频输出
			source.connect(this.audioContext.destination);
		}
	
		source.start();

		// // 标记播放中
		// tune.active = true;

		// tune.source = source;
		tune.sources.push(source);

		this.drawCanvas();

		source.onended = () => {
			source.disconnect();


			// 需要处理多个 source 的情况
			tune.sources = tune.sources.filter( s => s !== source );

			// // 标记播放结束
			// tune.active = false;

			this.drawCanvas();

		};
	}
}

