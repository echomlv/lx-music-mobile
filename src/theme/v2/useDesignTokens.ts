import { useMemo } from 'react'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { tokens, type DesignTokens } from './tokens'

export interface SemanticColors {
  surface: string
  surfaceElevated: string
  surfaceMuted: string
  text: string
  textSecondary: string
  textTertiary: string
  border: string
  divider: string
  accent: string
  accentContrast: string
  input: string
  overlay: string
  destructive: string
}

export interface DesignSystem {
  /** 旧主题颜色对象 — 与 useTheme() 完全一致,直接透传,新组件可消费已有 c-* key */
  colors: LX.ActiveTheme
  /** v2 组件使用的语义颜色,由旧主题颜色派生,不改变主题包结构 */
  semanticColors: SemanticColors
  /** 新增的语义令牌(spacing / radius / elevation / motion / blur / typography) */
  tokens: DesignTokens
  /** Modern UI Feature Flag,由 setting['theme.useModernUI'] 控制 */
  isModernUI: boolean
  /** 当前主题是否深色 — 给 BlurView tint / StatusBar style 用 */
  isDark: boolean
}

/**
 * v2 组件统一入口:同时获取旧主题颜色 + 新设计令牌 + Feature Flag。
 *
 * 返回值已 useMemo 化,仅当主题或 Flag 变化时重新生成,避免 50+ 旧组件订阅 ThemeContext 的额外渲染。
 */
export const useDesignTokens = (): DesignSystem => {
  const colors = useTheme()
  const isModernUI = useSettingValue('theme.useModernUI')

  return useMemo<DesignSystem>(() => {
    const semanticColors: SemanticColors = {
      surface: colors['c-content-background'],
      surfaceElevated: colors['c-primary-light-1000-alpha-900'],
      surfaceMuted: colors['c-primary-light-200-alpha-700'],
      text: colors['c-font'],
      textSecondary: colors['c-font-label'],
      textTertiary: colors['c-primary-dark-100-alpha-500'],
      border: colors['c-border-background'],
      divider: colors['c-list-header-border-bottom'],
      accent: colors['c-primary'],
      accentContrast: colors['c-primary-light-1000'],
      input: colors['c-primary-input-background'],
      overlay: colors.isDark ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.18)',
      destructive: colors.isDark ? '#FF6B6B' : '#D92D20',
    }

    return {
      colors,
      semanticColors,
      tokens,
      isModernUI,
      isDark: colors.isDark,
    }
  }, [colors, isModernUI])
}
