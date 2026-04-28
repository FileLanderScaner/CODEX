import { Platform } from 'react-native';

export const ui = {
  colors: {
    background: '#F9F9FF',
    surface: '#FFFFFF',
    surfaceLow: '#F0F3FF',
    surfaceHigh: '#E7EEFE',
    text: '#151C27',
    muted: '#3C4A42',
    outline: '#DCE2F3',
    outlineStrong: '#BBCABF',
    primary: '#10B981',
    primaryInk: '#006C49',
    secondary: '#3755C3',
    danger: '#BA1A1A',
    warning: '#855300',
    goodBg: '#E7F8EF',
    goodInk: '#006C49',
    badgeBg: '#E9FBF2',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    pill: 9999,
  },
  spacing: {
    unit: 4,
    page: 20,
    card: 16,
    element: 12,
    gap: 8,
  },
  type: {
    display: {
      fontFamily: Platform.select({ web: 'Manrope, Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 32,
      fontWeight: '800',
      lineHeight: 40,
    },
    headline: {
      fontFamily: Platform.select({ web: 'Manrope, Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
    },
    title: {
      fontFamily: Platform.select({ web: 'Manrope, Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    body: {
      fontFamily: Platform.select({ web: 'Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySm: {
      fontFamily: Platform.select({ web: 'Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    label: {
      fontFamily: Platform.select({ web: 'Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
      letterSpacing: 0.3,
    },
    price: {
      fontFamily: Platform.select({ web: 'Manrope, Inter, system-ui, sans-serif', default: undefined }),
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 32,
      fontVariant: ['tabular-nums'],
    },
  },
};

export function shadow(level = 1) {
  if (level <= 1) {
    return Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(55, 85, 195, 0.10)' },
      default: {
        shadowColor: '#173BAB',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
        elevation: 2,
      },
    });
  }

  return Platform.select({
    web: { boxShadow: '0px 14px 36px rgba(55, 85, 195, 0.16)' },
    default: {
      shadowColor: '#173BAB',
      shadowOpacity: 0.16,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
    },
  });
}
