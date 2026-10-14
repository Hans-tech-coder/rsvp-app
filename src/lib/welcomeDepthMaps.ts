// A depth map only fits the photo it was made from. When the admin swaps the
// background, the screen falls back to the flat photo until a new map is added here.
// The Welcome editor warns about this (hasDepthMap).
type Rect = readonly [number, number, number, number];
export const DEPTH_MAPS: Record<string, { depth: string; subject: Rect; unlit?: Rect }> = {
  'https://zclb8o6hebl8hcyr.public.blob.vercel-storage.com/images/welcome-bg-axudzflkDlVGWsNhY7twkhYJRWfWLI.webp': {
    depth: '/images/welcome-depth.webp',
    subject: [0.33, 0.3, 0.67, 0.95], // the couple, in image uv
    unlit: [0.517, 0.39, 0.048, 0.058], // groom's hair: ellipse centre + radii, in image uv
  },
};

export const hasDepthMap = (imageUrl: string) => imageUrl in DEPTH_MAPS;
