// the itch.io build (scripts/build-itch.js) is static, so its pages are prerendered
export const prerender = import.meta.env.MODE === 'itch';
