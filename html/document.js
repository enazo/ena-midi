

const tunes = [
	{
		"name": "do",
		key: 49,
		button: 1,
		"filename": "200-do"
	},
	{
		"name": "re",
		key: 50,
		button: 2,
		"filename": "201-re"
	},
	{
		"name": "mi",
		key: 51,
		button: 3,
		"filename": "202-mi"
	},
	{
		"name": "fa",
		key: 52,
		button: 4,
		"filename": "203-fa"
	},
	{
		"name": "so",
		key: 53,
		button: 5,
		"filename": "204-so"
	},
	{
		"name": "ra",
		key: 54,
		button: 6,
		"filename": "205-ra"
	},
	{
		"name": "shi",
		key: 55,
		button: 7,
		"filename": "206-shi"
	},
	{
		"name": "do",
		key: 56,
		button: 8,
		"filename": "207-do"
	}
];

const appEl = document.querySelector('.app');

const configs = {
	tunes,
	appEl,
	// app canvas 宽高
	appWidth: 600,
	appHeight: 800,
	
};



new Tune(configs);