import { memo } from 'react'
import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { type ListInfoItem } from '@/store/songlist/state'

import Image from '@/components/common/Image'
import { Surface, Typography, V2Pressable } from '@/components/v2/atoms'

export interface ListItemProps {
  item: ListInfoItem
  index: number
  width: number
  showSource: boolean
  onPress: (item: ListInfoItem, index: number) => void
}

const GAP = 14

/**
 * v2 歌单卡片项:更大封面 + 双行文字 + 角标(播放数 / source)。
 * 封面用 Surface(elevation=sm)托底拿轻投影,标题独立行,弱字色显示播放数。
 */
export default memo(({ item, index, width, showSource, onPress }: ListItemProps) => {
  const { colors, tokens } = useDesignTokens()
  const itemWidth = width - GAP
  const handlePress = () => { onPress(item, index) }

  if (!item.source) {
    return <View style={{ width: itemWidth, margin: GAP / 2 }} />
  }

  return (
    <View style={{ width: itemWidth, margin: GAP / 2 }}>
      <V2Pressable onPress={handlePress}>
        <Surface
          variant="solid"
          radius="lg"
          elevation="sm"
          backgroundColor={colors['c-primary-light-300-alpha-200']}
          style={{ width: itemWidth, height: itemWidth }}
        >
          <Image
            url={item.img}
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`}
            style={{ width: itemWidth, height: itemWidth }}
          />
          {item.play_count
            ? (
                <View
                  style={{
                    position: 'absolute',
                    left: tokens.spacing.xs,
                    bottom: tokens.spacing.xs,
                    paddingHorizontal: tokens.spacing.xs,
                    paddingVertical: 1,
                    borderRadius: tokens.radius.pill,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}
                >
                  <Typography variant="caption" weight="500" color="#fff">
                    {item.play_count}
                  </Typography>
                </View>
              )
            : null}
          {showSource
            ? (
                <View
                  style={{
                    position: 'absolute',
                    top: tokens.spacing.xs,
                    right: tokens.spacing.xs,
                    paddingHorizontal: tokens.spacing.xs,
                    paddingVertical: 1,
                    borderRadius: tokens.radius.sm,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}
                >
                  <Typography variant="caption" weight="500" color="#fff">
                    {item.source}
                  </Typography>
                </View>
              )
            : null}
        </Surface>
      </V2Pressable>
      <V2Pressable onPress={handlePress} style={{ marginTop: tokens.spacing.sm }}>
        <Typography variant="label" weight="500" numberOfLines={2}>
          {item.name}
        </Typography>
        {item.author
          ? (
              <Typography
                variant="caption"
                color={colors['c-font-label']}
                numberOfLines={1}
                style={{ marginTop: 2 }}
              >
                {item.author}
              </Typography>
            )
          : null}
      </V2Pressable>
    </View>
  )
})
