export const APP_STATE = 'BMG • Matter of Perspective V2';
export const DX = 450;
export const DY = 800;

// working title, split into the home page's two lines
export const TITLE = ['Dark Matter', 'of Perspective'];
export const TAGLINE = 'It takes a shift';
// where the daily's share card sends people
export const GAME_URL = 'https://beautiful-mind-games.itch.io/dark-matter-of-perspective';

// what the player calls a difficulty; the code's name for it ('hard') is the generator's, and is in the saves' keys
export const DIFF_NAMES = { easy: 'easy', hard: 'not easy', expert: 'quite hard' };
export const LEVELS = [
	{ id: '4easy', N: 4, diff: 'easy', label: '4×4', sub: DIFF_NAMES.easy },
	{ id: '4hard', N: 4, diff: 'hard', label: '4×4', sub: DIFF_NAMES.hard },
	{ id: '4expert', N: 4, diff: 'expert', label: '4×4', sub: DIFF_NAMES.expert },
	{ id: '5easy', N: 5, diff: 'easy', label: '5×5', sub: DIFF_NAMES.easy },
	{ id: '5hard', N: 5, diff: 'hard', label: '5×5', sub: DIFF_NAMES.hard },
	{ id: '5expert', N: 5, diff: 'expert', label: '5×5', sub: DIFF_NAMES.expert }
];

// sphere radius by size, in hundredths of a cell; the same in the board and the horizon
export const R = [0, 17, 29, 44];
export const NAMES = ['clear', 'small', 'medium', 'large'];
// the side facing the player after r clockwise turns of the board
export const SIDES = ['South', 'East', 'North', 'West'];

// the map's width, and the tray's: its lanes line up under the map's columns at the same scale
export const MAP = 330;
// a quarter turn slides the tray's planets this far, one side's lineup out and the next one's in;
// they follow the finger, so it's also the swipe for a quarter turn
export const SWIPE_PX = MAP + 40;
// a swipe's last stretch, to rest; a whole quarter turn on a tap of an arrow (or ← →)
export const TURN_MS = 420;
export const TAP_TURN_MS = 500;
// a half turn, on holding an arrow (or ↑ ↓), and how long the hold takes
export const HALF_TURN_MS = 700;
export const HOLD_MS = 400;
// the splash slides off to the left as the page slides in from the right, pushing it, in this long
export const SPLASH_SLIDE_MS = 700;
// One page pushes another the same way, in this long. They stand in a row, Home, the launcher, a game, so going on
// pushes to the left and Back to the right.
export const PAGE_SLIDE_MS = 500;
// Play new: the map flips a quarter turn about its horizontal axis, its gold edge coming towards the player, till it's
// edge-on, the next sky is charted out of sight, and it flips back, each way in this long, at an even pace. Coming to
// the game page for a new puzzle, it starts edge-on and only flips back.
export const FLIP_MS = 500;
// how long it stays edge-on, only its gold edge showing, before flipping back, at the least
export const FLIP_PAUSE_MS = 500;
// how far the player is from the map as it flips, in px; nearer makes the gold edge look wider
export const FLIP_PERSPECTIVE = 1000;

export const PROMPT_SURRENDER = 'Average will be affected — give up?';
export const PROMPT_RESET_STATS = 'Reset stats — are you sure?';
// Clear All's prompt, by name; its text gives the price
export const PROMPT_CLEAR_ALL = 'clear all';
export const clearAllText = (n) => `Clear ${n} planet${n === 1 ? '' : 's'} — $${n * COST_CHANGE}?`;
export const PROMPT_PLAY_NEW = 'Play new';
export const MSG_AVERAGE_IMPROVED = 'Average improved!';
export const MSG_BEST_SCORE = 'Best score!';
export const MSG_WON = 'No more dark matter!';
export const MSG_BROKE = 'No more dark matter — but you shifted into the red.';
export const MSG_REVEALED = 'This is how the sky really lies.';

// Each game starts with a bank. Every turn costs, half turns the same, and so does changing your mind about a cell (another size,
// or clearing it); the first mark in a blank cell is free. A game given up scores no more than breaking even.
export const BANK = 10;
export const COST_TURN = 1;
export const COST_CHANGE = 1;
// the palette: at the selected cell, on the map (being tried), or below the tray (as before)
export const PALETTE_AT_CELL = true;
export const MSG_THINK_TWICE = `Think twice — changing your mind costs $${COST_CHANGE}.`;
// how long the game-over message stays before Play new takes its place
export const OVER_MS = 4000;
