<script>
	import { PROMPT_CLEAR_ALL, PROMPT_RESET_STATS, PROMPT_SURRENDER } from './const';
	import { goBack, isOver, persistCommon, planetCount, ss } from './shared.svelte';
	import { _sound } from './sound.svelte';
	import TextButton from './Text Button.svelte';

	const noSurrender = $derived(ss.launcher || !ss.pzl || isOver() || ss.prompt === PROMPT_SURRENDER);
	const noClearAll = $derived(ss.launcher || isOver() || !planetCount() || ss.prompt === PROMPT_CLEAR_ALL);
	const noResetStats = $derived(ss.launcher || ss.stats.plays === 0 || ss.prompt === PROMPT_RESET_STATS);

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
	<TextButton text={['Back']} onClick={goBack} />
	<TextButton
		text={['Clear', 'All']}
		disabled={noClearAll}
		onClick={() => {
			delete ss.sel;
			ss.prompt = PROMPT_CLEAR_ALL;
		}}
	/>
	<TextButton text={['Give', 'Up']} disabled={noSurrender} onClick={() => (ss.prompt = PROMPT_SURRENDER)} />
	<TextButton text={['Reset', 'Stats']} disabled={noResetStats} onClick={() => (ss.prompt = PROMPT_RESET_STATS)} />
	<TextButton text={['Sound', _sound.sfx ? 'On' : 'Off']} onClick={onSfx} />
	<TextButton text={['Music', _sound.music ? 'On' : 'Off']} onClick={onMusic} />
</div>

<style>
	.toolbar {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		align-items: center;
		width: 410px;
		height: 46px;
		margin: 0 auto 12px;
		border-top: 1px solid #8f86ff33;
		padding-top: 8px;
	}
</style>
