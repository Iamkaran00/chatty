
const images = import.meta.glob('./*.{png,jpg,jpeg,svg,gif}', { eager: true });
export const wallpapers = Object.values(images).map((mod) => mod.default || mod);
