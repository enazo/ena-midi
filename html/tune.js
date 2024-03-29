
function createEchoDelayEffect(audioContext) {
    const delay = audioContext.createDelay(1);
    const dryNode = audioContext.createGain();
    const wetNode = audioContext.createGain();
    const mixer = audioContext.createGain();
    const biquadFilter = audioContext.createBiquadFilter();

    delay.delayTime.value = 0.75;
    dryNode.gain.value = 1;
    wetNode.gain.value = 0;
    biquadFilter.frequency.value = 1100;
    biquadFilter.type = "highpass";

    return {
		apply: function () {
			wetNode.gain.setValueAtTime(0.75, audioContext.currentTime);
		},
		discard: function () {
			wetNode.gain.setValueAtTime(0, audioContext.currentTime);
		},
		isApplied: function () {
			return wetNode.gain.value > 0;
		},
		placeBetween: function (inputNode, outputNode) {
			inputNode.connect(delay);
			delay.connect(wetNode);
			wetNode.connect(biquadFilter);
			biquadFilter.connect(delay);

			inputNode.connect(dryNode);
			dryNode.connect(mixer);
			wetNode.connect(mixer);
			mixer.connect(outputNode);
		},
    };
}
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
		appEl.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillStyle = 'black';

		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";

		this.ctx.font = 'bold 30px sans-serif';
		this.ctx.fillStyle = 'black';

		this.audioContext = new (window.AudioContext || window.webkitAudioContext)();


		this.distortion = this.audioContext.createWaveShaper();
		this.gainNode = this.audioContext.createGain();
		
		this.biquadFilter = this.audioContext.createBiquadFilter();
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.minDecibels = -90;
		this.analyser.maxDecibels = -10;
		this.analyser.smoothingTimeConstant = 0.85;
		this.convolver = this.audioContext.createConvolver();

		this.echoDelay = createEchoDelayEffect(this.audioContext);

		this.echoDelay.placeBetween(this.gainNode, this.analyser);
		this.echoDelay.apply();

		this.tunes = tunes;
		this.keyToTune = {};
		this.buttons = [];


		this.keyPressed = {};
		window.addEventListener('keydown',e=>this.onKeyDown(e));
		window.addEventListener('keyup',e=>this.onKeyUp(e));

		this.canvas.addEventListener('click', e => this.onClick(e));
		// this.canvas.addEventListener('contextmenu', e => e.preventDefault());
		this.canvas.addEventListener('mousedown', e => e.preventDefault());
		// this.canvas.addEventListener('mouseup', e => e.preventDefault());

		tunes.forEach( tune => {
			const { name, filename } = tune;

			tune.sources = [];

			this.keyToTune[tune.key] = tune;

			tune.type = 'tune';
			this.buttons.push(tune);
			
			fetch(this.filenameToURL(filename))
				.then(response => response.arrayBuffer())
				.then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
				.then(audioBuffer => {
					tune.buffer = audioBuffer;
				});
		});





		this.loop = false;

		this.loopStartMs = undefined;
		this.loopCycleMs = 3000;


		this.buttons[8] = {
			type: 'func',
			text: ':||',
			onClick: () => {
				this.loopStop();
				this.loop = false;
				this.echo = false;
				this.tunes.forEach(tune=>{
					tune.sources.forEach(source=>{
						source.stop();
					});
				})
			}
		}
		this.buttons[9] = {
			type: 'func',
			text: 'Loop',
			onClick: () => {
				this.loop = !this.loop;
				this._drawCanvas();

				if(this.loop){
					this.loopStart();
				}else{
					this.loopStop();
				}
			}
		}

		this.echo = false;
		this.buttons[10] = {
			type: 'func',
			text: 'Echo',
			onClick: () => {
				this.echo = !this.echo;
				this._drawCanvas();

				// if(this.echo){
				// 	this.echoDelay.apply();
				// }else{
				// 	if(this.echoDelay.isApplied()){
				// 		this.echoDelay.discard();
				// 	}
				// }
			}
		}

		this.buttons[11] = {
			type: 'func',
			text: 'Record',
			onClick: () => {
				alert('录制功能还没写！先用别的屏幕录制啥的，或者帮我来写代码');
			}
		}
		
		const runNextFrame = () => {
			requestAnimationFrame(runNextFrame);
			this.drawCanvas();
		}

		runNextFrame();
	}

	loopStart(){
		this.loopTunes = [];
		this.loopStartMs = +new Date();
		setTimeout(()=>{
			this.runOneLoop();
		},this.loopCycleMs);
	}
	loopStop(){
		this.loopTunes = [];
	}
	runOneLoop(){
		this.loopStartMs = +new Date();
		this.loopTunes.forEach(loopTune=>{
			this.playSound(
				loopTune.tune,
				loopTune.echo,
				loopTune.ms
			);
		});
		setTimeout(()=>{
			this.runOneLoop();
		},this.loopCycleMs);
	}

	drawCanvas(){
		const { appWidth, appHeight,  } = this.config;
		this.ctx.clearRect(0, 0, appWidth, appHeight);
		
		// 绘制 Tune 九宫格
		const { tuneWidth } = this;
		this.buttons.forEach( (button, index) => {
			const x = (index % 3) * tuneWidth;
			const y = Math.floor(index/3) * tuneWidth;

			let text = '';
			let active = false;
			let background = 'rgba(0, 0, 0, 0.1)';

			if(button.type === 'func'){
				text = button.text;
				if(button.text === 'Loop'){
					active = this.loop;
				}else if(button.text === 'Echo'){
					active = this.echo;
				}
			}else if(button.type === 'tune'){

				const tune = button;
				text = tune.name;

				// active = tune.sources.length > 0;
				// // 需要修改成判断 这些 source 都在没在播放


				// 240212
				const nowMs = +new Date();
				active = tune.sources.find(source=>{
					if(!source.startTime) return;

					// 判断是否在播放
					console.log(source.startTime - nowMs, source.startTime, nowMs)
					// 如果尚未开始播放，不算在播放
					// const diffMs = nowMs - source.startTime;

					// // 允许容差100ms
					// if(diffMs < -100) return;
					if(nowMs < source.startTime) return;

					return true;
				});

				background = `hsl(${index * 50}deg, 100%, 90%)`;
				if(active){


					// todo 获取当前播放进度，并减淡颜色
					
					// const lastSource = tune.sources[tune.sources.length - 1];
					// // 获取当前播放源 播放进度
					// const { currentTime } = this.audioContext;
					// const duration = lastSource.buffer.duration;
	
	
					// // todo 这里还要记录下当前 source 开始播放时间，减去当前时间，算出当前播放进度
					// console.log('duration', lastSource.buffer.duration);
	
				}
	
			}


			if(active){
				this.ctx.fillStyle = background;
				this.ctx.fillRect(x, y, tuneWidth, tuneWidth);
			}


			this.ctx.fillStyle = 'black';
			this.ctx.fillText(
				text, 
				x + tuneWidth / 2, 
				y + tuneWidth / 2, 
			);
		});

		// todo 绘制停止按钮 ？

		// todo 绘制 Loop 按钮

		// todo 绘制 Filter 按钮

	}

	_drawCanvas(){
		// this.drawCanvas();
	}
	
	filenameToURL (filename) {
		return '/kitsu/' + filename + '-v2.m4a';
	}

	playSound (tune, filter, ms = 0) {

		var source = this.audioContext.createBufferSource();
		source.buffer = tune.buffer;
		// source.loop = loop;
	
		if (filter) {
			// 创建一个低通滤波器
			// var biquadFilter = this.audioContext.createBiquadFilter();
			// biquadFilter.type = 'lowshelf';
			// biquadFilter.frequency.value = 200;
			// biquadFilter.gain.value = 25;
			
			// source.connect(biquadFilter);
			// biquadFilter.connect(this.audioContext.destination);


			source.connect(this.distortion);
			this.distortion.connect(this.biquadFilter);
			this.biquadFilter.connect(this.gainNode);
			this.convolver.connect(this.gainNode);
			this.echoDelay.placeBetween(this.gainNode, this.analyser);
			this.analyser.connect(this.audioContext.destination);


		} else {
			// 直接连接到音频输出
			source.connect(this.audioContext.destination);
		}
		
		const sourceStartTime = this.audioContext.currentTime + ms * 0.001;
		source.start(sourceStartTime);

		const nowMs = +new Date();
		const startTime = nowMs + ms;

		source.startTime = startTime;
		// // 标记播放中
		// tune.active = true;

		// tune.source = source;
		tune.sources.push(source);

		this._drawCanvas();

		source.onended = () => {
			source.disconnect();


			// 需要处理多个 source 的情况
			tune.sources = tune.sources.filter( s => s !== source );

			// // 标记播放结束
			// tune.active = false;

			this._drawCanvas();

		};
	}

	playTune (tune) {
		
		// const now = +Date.now();

		// console.log(tune.lastPlayed);
		// if (
		// 	tune.lastPlayed
		// 	&&
		// 	(now - tune.lastPlayed) < this.minInterval
		// ) return;

		// tune.lastPlayed = now;


		if(this.loop){
			// 如果是 开启循环时，要记录播放旋律开始时间
			const now = +new Date();
			const loopTune = {
				ms: (now - this.loopStartMs) % this.loopCycleMs,
				tune,
				echo: this.echo
			};

			console.log(loopTune);

			this.loopTunes.push(loopTune);
		}

		this.playSound(tune, this.echo);
	}

	onKeyDown(e){

		let { key, keyCode } = e;

		console.log(key, keyCode);
		
		if(this.keyPressed[keyCode]) return;

		this.keyPressed[keyCode] = true;
		
		const tune = this.keyToTune[keyCode];
		if (tune){
			this.playTune(tune);
		}

	}

	onKeyUp(e){
		let { key, keyCode } = e;
		this.keyPressed[keyCode] = false;
	}

	onClick(e){
		e.preventDefault();

		const x = e.offsetX;
		const y = e.offsetY;

		const appNarWidth = this.canvas.offsetWidth / 3;

		console.log(x,y,appNarWidth)

		console.log(
			Math.floor(x / appNarWidth),
			Math.floor(y / appNarWidth) * 3
		)

		const index = 
			Math.floor(x / appNarWidth) + 
			Math.floor(y / appNarWidth) * 3;


		const button = this.buttons[index];
		if(!button) return;

		if(button.type === 'func'){
			button.onClick();
		}else if(button.type === 'tune'){
			this.playTune(button);
		}
	}
}

