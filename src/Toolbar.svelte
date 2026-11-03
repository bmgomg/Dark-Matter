<script>
	import { PROMPT_RESET_STATS, PROMPT_SURRENDER } from './const';
	import { goHome, isOver, persistCommon, ss } from './shared.svelte';
	import { _sound } from './sound.svelte';
	import TextButton from './Text Button.svelte';

	const noSurrender = $derived(!ss.pzl || isOver() || ss.prompt === PROMPT_SURRENDER);
	const noResetStats = $derived(ss.stats.plays === 0 || ss.prompt === PROMPT_RESET_STATS);

	const onSfx = () => {
		_sound.sfx = 1 - _sound.sfx;

		if (_sound.sfx) {
			_sound.play('won', { rate: 4 });
		}

		persistCommon();
	};

	const onMusic = () => {
		_sound.music = 1 - _sound.music;
		_sound.playMusic();

		persistCommon();
	};
</script>

<div class="toolbar">
	<TextButton text={['Home']} onClick={goHome} />
	<TextButton text={['Give', 'Up']} disabled={noSurrender} onClick={() => (ss.prompt = PROMPT_SURRENDER)} />
	<TextButton text={['Reset', 'Stats']} disabled={noResetStats} onClick={() => (ss.prompt = PROMPT_RESET_STATS)} />
	<TextButton text={['Sound', _sound.sfx ? 'On' : 'Off']} onClick={onSfx} />
	<TextButton text={['Music', _sound.music ? 'On' : 'Off']} onClick={onMusic} />
</div>

<style>
	.toolbar {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		align-items: center;
		width: 410px;
		height: 46px;
		margin: 0 auto 12px;
		border-top: 1px solid #8f86ff33;
		padding-top: 8px;
	}
</style>
