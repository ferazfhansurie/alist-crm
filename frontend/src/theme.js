import { extendTheme } from '@chakra-ui/react';

/**
 * A-List "Marque" design tokens.
 * Warm paper canvas, ink structure, a-list red reserved for signal moments.
 */
export const tokens = {
  canvas: '#f6f5f1',
  surface: '#ffffff',
  surfaceTint: '#fbfaf7',
  rail: '#141519',
  railSoft: '#1d1f25',
  ink: '#17181c',
  inkSoft: '#41454e',
  muted: '#787d87',
  faint: '#a2a6ae',
  border: '#e7e5de',
  borderSoft: '#efede7',
  borderStrong: '#d6d3ca',
  red: '#e8384f',
  redDeep: '#bb2038',
  redWash: '#fdf1f2',
  redBorder: '#f6ccd2',
  ok: '#1f8a54',
  okWash: '#e9f7ef',
  warn: '#b4770a',
  warnWash: '#fdf4e3',
  info: '#3563ab',
  infoWash: '#eef3fb'
};

export const statusPalette = {
  New: { fg: '#565b66', bg: '#f1f0ec', dot: '#8a8f99' },
  Contacted: { fg: '#9a5200', bg: '#fdf1e0', dot: '#e08715' },
  'Meeting Set': { fg: '#2d5da8', bg: '#eaf1fb', dot: '#4a7ed3' },
  'Meeting Done': { fg: '#63419f', bg: '#f2edfb', dot: '#7e58c8' },
  Converted: { fg: '#176d43', bg: '#e7f6ee', dot: '#22a361' },
  Disqualified: { fg: '#a3242f', bg: '#fdeeef', dot: '#dd4553' },
  Duplicate: { fg: '#836400', bg: '#faf4d9', dot: '#cfa900' }
};

export const channelPalette = {
  Meta: '#1877F2',
  TikTok: '#e8384f',
  Google: '#38A169',
  'Founder Series': '#c99b3f',
  'Boss / Manual': '#6B46C1',
  Talent: '#DD6B20',
  'Past Client': '#319795',
  Website: '#2B6CB0'
};

const fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const displayStack = "'Fraunces', 'Iowan Old Style', Georgia, serif";

export const theme = extendTheme({
  fonts: {
    heading: fontStack,
    body: fontStack,
    display: displayStack
  },
  colors: {
    alist: {
      50: '#fdf1f2',
      100: '#f9dde1',
      200: '#f2b3bd',
      300: '#ee8494',
      400: '#eb5a70',
      500: '#e8384f',
      600: '#bb2038',
      700: '#95192d',
      800: '#701322',
      900: '#141519'
    }
  },
  shadows: {
    lift: '0 1px 2px rgba(23, 24, 28, .05), 0 4px 14px rgba(23, 24, 28, .05)'
  },
  styles: {
    global: {
      body: { bg: tokens.canvas, color: tokens.ink, fontSize: '14px' },
      '*': { borderColor: tokens.border },
      '*:focus-visible': { outline: `2px solid ${tokens.red}`, outlineOffset: '1px' }
    }
  },
  components: {
    Button: {
      baseStyle: { borderRadius: '7px', fontWeight: 600 },
      variants: {
        ink: {
          bg: tokens.ink,
          color: 'white',
          _hover: { bg: '#2a2c33', _disabled: { bg: tokens.ink } },
          _active: { bg: '#000' }
        },
        signal: {
          bg: tokens.red,
          color: 'white',
          _hover: { bg: tokens.redDeep, _disabled: { bg: tokens.red } },
          _active: { bg: '#95192d' }
        },
        quiet: {
          bg: 'white',
          border: '1px solid',
          borderColor: tokens.border,
          color: tokens.inkSoft,
          _hover: { borderColor: tokens.borderStrong, bg: tokens.surfaceTint },
          _active: { bg: tokens.borderSoft }
        }
      }
    },
    Input: {
      defaultProps: { focusBorderColor: 'alist.500' },
      sizes: { sm: { field: { borderRadius: '7px' } }, md: { field: { borderRadius: '7px' } } }
    },
    Select: {
      defaultProps: { focusBorderColor: 'alist.500' },
      sizes: { sm: { field: { borderRadius: '7px' } }, md: { field: { borderRadius: '7px' } } }
    },
    Textarea: { defaultProps: { focusBorderColor: 'alist.500' } },
    FormLabel: {
      baseStyle: {
        fontSize: '11px',
        fontWeight: 650,
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        color: tokens.muted,
        mb: '6px'
      }
    },
    Tooltip: {
      baseStyle: { bg: tokens.ink, color: 'white', borderRadius: '6px', fontSize: '12px', px: 2.5, py: 1.5 }
    },
    Menu: {
      baseStyle: {
        list: { borderRadius: '9px', borderColor: tokens.border, boxShadow: 'lift', py: 1.5 },
        item: { fontSize: '13px' }
      }
    },
    Modal: {
      baseStyle: { dialog: { borderRadius: '12px' } }
    },
    Badge: {
      baseStyle: { textTransform: 'none', fontWeight: 600 }
    }
  }
});
