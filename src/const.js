export const APP_STATE = 'BMG • Matter of Perspective V1';
export const DX = 450;
export const DY = 800;

// working title, split into the home page's two lines
export const TITLE = ['Dark Matter', 'of Perspective'];
export const TAGLINE = 'It takes a shift';

export const LEVELS = [
	{ id: '4easy', N: 4, diff: 'easy', label: '4×4', sub: 'easy' },
	{ id: '4hard', N: 4, diff: 'hard', label: '4×4', sub: 'hard' },
	{ id: '5easy', N: 5, diff: 'easy', label: '5×5', sub: 'easy' },
	{ id: '5hard', N: 5, diff: 'hard', label: '5×5', sub: 'hard' }
];

// sphere radius by size, in hundredths of a cell; the same in the board and the horizon
export const R = [0, 17, 29, 44];
export const NAMES = ['empty', 'small', 'medium', 'large'];
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

export const PROMPT_SURRENDER = 'Show the solution?';
export const PROMPT_RESET_STATS = 'Reset stats — are you sure?';
export const PROMPT_WRONG = 'wrong';
export const PROMPT_PLAY_NEW = 'Play new';
export const MSG_AVERAGE_IMPROVED = 'Average improved!';
export const MSG_BEST_SCORE = 'Best score!';
export const MSG_WON = 'No more dark matter!';
export const MSG_REVEALED = 'This is how the sky really lies.';
// how long the game-over message stays before Play new takes its place
export const OVER_MS = 3000;
