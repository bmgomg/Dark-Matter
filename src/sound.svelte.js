import music from '$lib/sounds/music.ogg';
import { Howl } from 'howler/dist/howler.core.min';
import { play, voices } from './sfx';

const MUSIC_VOLUME = 0.4;
const MUSIC_FADE_MS = 5000;

// Silent until it plays: Howler queues calls made before the file has loaded, and a queued fade would hold up a queued
// "off" till it ended, so the first fade waits for the first play event (the only one: Howler emits another at every
// rewind of the loop, which mustn't fade).
const loop = new Howl({ src: [music], loop: true, volume: 0 });

// up from silence whenever it starts or resumes; off at once
const setMusic = () => {
	if (_sound.music > 0) {
		loop.fade(0, MUSIC_VOLUME, MUSIC_FADE_MS);
	} else {
		loop.volume(0);
	}
};

export const _sound = $state({
	sfx: 1,
	music: 1,
	playMusic: () => {
		if (!_sound.musicPlayed) {
			_sound.musicPlayed = true;
			loop.once('play', setMusic);
			loop.play();
		} else if (loop.playing()) {
			setMusic();
		}
	},
	stopMusic: () => {
		loop.stop();
	}
});

// The effects (sfx.js), each by its name, played only with SFX on: sfx.tap(), sfx.turn(ms, dir), ...
export const sfx = Object.fromEntries(
	Object.keys(voices).map((name) => [
		name,
		(...args) => {
			if (_sound.sfx) {
				play(name, ...args);
			}
		}
	])
);
