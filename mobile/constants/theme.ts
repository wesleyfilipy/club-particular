// ====================================================================
// ESCALA SWIPE - LUXURY DARK & GOLD DESIGN SYSTEM TOKENS
// Palette: Obsidian, Deep Charcoal, Metallic Champagne Gold & Warm Accents
// ====================================================================

export const COLORS = {
  // Backgrounds
  background: '#090A0F', // Obsidian black core
  surface: '#12141D',    // Deep Charcoal card background
  surfaceElevated: '#1A1D29', // High elevation card
  surfaceBorder: '#282C3D', // Subtle glass line

  // Gold Accents
  gold: '#D4AF37',       // Signature Champagne Gold
  goldLight: '#F5D77F',  // Radiant Gold highlight
  goldDark: '#997D2E',   // Deep Muted Gold
  goldGradient: ['#F5D77F', '#D4AF37', '#997D2E'] as const,
  goldGlow: 'rgba(212, 175, 55, 0.25)',

  // Status & Feedback
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Text Hierarchy
  text: '#FFFFFF',
  textSecondary: '#A0A5B5',
  textMuted: '#6B7280',
  textDark: '#090A0F',

  // UI Overlays
  overlay: 'rgba(9, 10, 15, 0.85)',
  glassBackground: 'rgba(18, 20, 29, 0.75)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const SHADOWS = {
  goldGlow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};
