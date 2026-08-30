import { extendTheme } from '@chakra-ui/react';

export const colors = {
  ink: '#15181d',
  accent: '#e8384f',
  accentDark: '#c5203a',
  accentPale: '#fde3e7',
  page: '#fafafa',
  border: '#e2e8f0',
  muted: '#718096'
};

export const theme = extendTheme({
  fonts: {
    heading: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  colors: {
    alist: {
      50: '#fff3f5',
      100: '#fde3e7',
      500: '#e8384f',
      600: '#c5203a',
      900: '#15181d'
    }
  },
  styles: {
    global: {
      body: { bg: colors.page, color: colors.ink },
      '*': { borderColor: colors.border }
    }
  },
  components: {
    Button: {
      defaultProps: { borderRadius: '9px' }
    },
    Input: {
      defaultProps: { focusBorderColor: 'alist.500' }
    },
    Select: {
      defaultProps: { focusBorderColor: 'alist.500' }
    }
  }
});
