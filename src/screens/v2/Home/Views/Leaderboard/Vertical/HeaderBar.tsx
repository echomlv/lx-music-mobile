import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import leaderboardState, { type InitState } from '@/store/leaderboard/state'

import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'

import { Icon } from '@/components/common/Icon'
import { Typography, V2Pressable } from '@/components/v2/atoms'

type Sources = Readonly<InitState['sources']>
type SourceSelectorCommonProps = _SourceSelectorProps<Sources>
type SourceSelectorCommonType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: SourceSelectorCommonProps['onSourceChange']
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

/**
 * v2 排行榜 HeaderBar:左侧 source chip,右侧当前榜单 pill + chevron。
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const sourceSelectorRef = useRef<SourceSelectorCommonType>(null)
  const [activeName, setActiveName] = useState('')

  useImperativeHandle(ref, () => ({
    setBound(source, _id, name) {
      sourceSelectorRef.current?.setSourceList(leaderboardState.sources, source)
      setActiveName(name)
    },
  }), [])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.sm,
        backgroundColor: colors['c-content-background'],
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.sm,
        zIndex: 2,
      }}
    >
      <View
        style={{
          height: 32,
          minWidth: 70,
          paddingHorizontal: tokens.spacing.xs,
          borderRadius: tokens.radius.pill,
          backgroundColor: colors['c-primary-light-200-alpha-700'],
          justifyContent: 'center',
        }}
      >
        <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center fontSize={13} />
      </View>
      <V2Pressable
        onPress={onShowBound}
        style={{
          flex: 1,
          height: 32,
          borderRadius: tokens.radius.pill,
          borderWidth: 1,
          borderColor: colors['c-border-background'],
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            paddingHorizontal: tokens.spacing.md,
            gap: 4,
          }}
        >
          <Typography
            variant="label"
            weight="500"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {activeName}
          </Typography>
          <Icon
            name="chevron-right"
            size={12}
            color={colors['c-font-label']}
          />
        </View>
      </V2Pressable>
    </View>
  )
})
