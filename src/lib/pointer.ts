// `t-mouse` on <html> means "this guest has a mouse/trackpad". The pointer-init
// script in layout.tsx sets it from the `(hover: hover) and (pointer: fine)`
// query or the first real mouse move, and clears it on touch: Chrome can report
// `hover: none` with a real mouse (e.g. a Bluetooth mouse that connected after
// Chrome started), so the media query alone is not trusted anywhere.
export const MOUSE_CLASS = 't-mouse';

export const hasMouse = () => document.documentElement.classList.contains(MOUSE_CLASS);
