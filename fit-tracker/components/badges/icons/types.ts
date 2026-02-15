/** 5-stop metallic color palette for 3D badge icon rendering */
export interface MetallicPalette {
  darkest: string;  // deepest shadow (bottom-right edges, behind shapes)
  dark: string;     // base shadow (dark side of metallic gradient)
  mid: string;      // base color (center of metallic surface)
  light: string;    // highlight (light-facing surface)
  lightest: string; // specular (hot spot where light hits directly)
  glow: string;     // outer glow color (with alpha, for ambient emission)
}

export interface BadgeIconProps {
  size: number;
  palette: MetallicPalette;
}
