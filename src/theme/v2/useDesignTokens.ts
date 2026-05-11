import { useMemo } from 'react'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { tokens, type DesignTokens } from './tokens'

export interface DesignSystem {
  /** 旧主题颜色对象 — 与 useTheme() 完全一致,直接透传,新组件可消费已有 c-* key */
  colors: LX.ActiveTheme
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

  return useMemo<DesignSystem>(() => ({
    colors,
    tokens,
    isModernUI,
    isDark: colors.isDark,
  }), [colors, isModernUI])
}
