// Local theme helpers that proxy to old theme variant files during migration
import { valorantDark, valorantLight } from './valorant';
import { futuristicBlueDark, futuristicBlueLight } from './futuristicBlue';
import { themenamedark as cyberpunkPurpleDark, themenamelight as cyberpunkPurpleLight } from './cyberpunkPurple';
import { hauntedGroveDark, hauntedGroveLight } from './hauntedGrove';
import { miamiViceDark, miamiViceLight } from './miamiVice';
import { prideDark, prideLight } from './pride';
import { themenamedark as cyberpunk77Dark, themenamelight as cyberpunk77Light } from './cyberpunk77';
import { sunsetDark, sunsetLight } from './sunset';
import { desertDark, desertLight } from './desert';
import { autumnDark, autumnLight } from './autumn';
import { arcticDark, arcticLight } from './arctic';
import { deepSeaDark, deepSeaLight } from './deepSea';
import { nebulaDark, nebulaLight } from './nebula';
import { nightCityDark, nightCityLight } from './nightCity';
import { tealOceanDark, tealOceanLight } from './tealOcean';
import { voidDarkTheme, voidLightTheme } from './voidDark';
import { voidDarkGreenTheme } from './voidDarkGreen';
import { 
  voidDarkRedTheme,
  voidDarkOrangeTheme,
  voidDarkYellowTheme,
  voidDarkBlueTheme,
  voidDarkPurpleTheme,
} from './voidDarkRainbow';
import type { Theme, ThemeColors } from './types';

export const availableThemes: Record<string, Theme> = {
  [nightCityDark.id]: nightCityDark,
  [nightCityLight.id]: nightCityLight,

  [valorantDark.id]: valorantDark,
  [valorantLight.id]: valorantLight,

  [futuristicBlueDark.id]: futuristicBlueDark,
  [futuristicBlueLight.id]: futuristicBlueLight,

  [cyberpunkPurpleDark.id]: cyberpunkPurpleDark,
  [cyberpunkPurpleLight.id]: cyberpunkPurpleLight,

  [hauntedGroveDark.id]: hauntedGroveDark,
  [hauntedGroveLight.id]: hauntedGroveLight,

  [miamiViceDark.id]: miamiViceDark,
  [miamiViceLight.id]: miamiViceLight,

  [prideDark.id]: prideDark,
  [prideLight.id]: prideLight,

  [cyberpunk77Dark.id]: cyberpunk77Dark,
  [cyberpunk77Light.id]: cyberpunk77Light,

  [tealOceanDark.id]: tealOceanDark,
  [tealOceanLight.id]: tealOceanLight,

  [voidDarkTheme.id]: voidDarkTheme,
  [voidLightTheme.id]: voidLightTheme,
  [voidDarkGreenTheme.id]: voidDarkGreenTheme,
  [voidDarkRedTheme.id]: voidDarkRedTheme,
  [voidDarkOrangeTheme.id]: voidDarkOrangeTheme,
  [voidDarkYellowTheme.id]: voidDarkYellowTheme,
  [voidDarkBlueTheme.id]: voidDarkBlueTheme,
  [voidDarkPurpleTheme.id]: voidDarkPurpleTheme,

  [sunsetDark.id]: sunsetDark,
  [sunsetLight.id]: sunsetLight,
  [desertDark.id]: desertDark,
  [desertLight.id]: desertLight,
  [autumnDark.id]: autumnDark,
  [autumnLight.id]: autumnLight,

  [arcticDark.id]: arcticDark,
  [arcticLight.id]: arcticLight,
  [deepSeaDark.id]: deepSeaDark,
  [deepSeaLight.id]: deepSeaLight,
  [nebulaDark.id]: nebulaDark,
  [nebulaLight.id]: nebulaLight,
};

export const defaultTheme: Theme = nightCityDark;

export const getThemeById = (themeId: string): Theme => {
  return availableThemes[themeId] || defaultTheme;
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--${cssVarName}`, value as string);
  });
};

export const themeVar = (key: keyof ThemeColors): string => {
  const cssVarName = (key as string).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `var(--${cssVarName})`;
};

export type { Theme as ThemeType } from './types';
export type { ThemeColors } from './types';

export {
  valorantDark, valorantLight,
  futuristicBlueDark, futuristicBlueLight,
  cyberpunkPurpleDark, cyberpunkPurpleLight,
  hauntedGroveDark, hauntedGroveLight,
  miamiViceDark, miamiViceLight,
  prideDark, prideLight,
  cyberpunk77Dark, cyberpunk77Light,
  nightCityDark, nightCityLight,
  tealOceanDark, tealOceanLight,
  voidDarkTheme, voidLightTheme,
  voidDarkGreenTheme,
  voidDarkRedTheme, voidDarkOrangeTheme, voidDarkYellowTheme,
  voidDarkBlueTheme, voidDarkPurpleTheme,
  sunsetDark, sunsetLight,
  desertDark, desertLight,
  autumnDark, autumnLight,
  arcticDark, arcticLight,
  deepSeaDark, deepSeaLight,
  nebulaDark, nebulaLight,
};


