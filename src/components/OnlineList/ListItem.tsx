import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useDesignTokens } from '@/theme/v2'
import { Typography, V2Pressable } from '@/components/v2/atoms'
import { useSettingValue } from '@/store/setting/hook'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }

  return info
}

interface ListItemProps {
  item: LX.Music.MusicInfoOnline
  index: number
  showSource?: boolean
  onPress: (musicInfo: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (musicInfo: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (musicInfo: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}

const ModernListItem = ({
  item,
  index,
  showSource,
  onPress,
  onLongPress,
  onShowMenu,
  selectedList,
  rowInfo,
  isShowAlbumName,
  isShowInterval,
}: ListItemProps) => {
  const { colors, tokens, semanticColors } = useDesignTokens()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const isSelected = selectedList.includes(item)
  const tagInfo = useQualityTag(item)
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  const handleShowMenu = () => {
    moreButtonRef.current?.measure((_fx, _fy, width, height, _px, _py) => {
      moreButtonRef.current?.measureInWindow((x, y) => {
        onShowMenu(item, index, {
          x: Math.ceil(x),
          y: Math.ceil(y),
          w: Math.ceil(width),
          h: Math.ceil(height),
        })
      })
    })
  }

  return (
    <View style={{ width: rowInfo.rowWidth, minHeight: ITEM_HEIGHT, paddingHorizontal: tokens.spacing.xs }}>
      <V2Pressable
        onPress={() => { onPress(item, index) }}
        onLongPress={() => { onLongPress(item, index) }}
        style={{
          minHeight: ITEM_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radius.md,
          backgroundColor: isSelected ? semanticColors.surfaceMuted : 'transparent',
        }}
      >
        <Typography
          variant="caption"
          color={isSelected ? colors['c-primary'] : semanticColors.textTertiary}
          style={{ width: 28, textAlign: 'center' }}
        >
          {index + 1}
        </Typography>
        <View style={{ flex: 1, minWidth: 0, paddingHorizontal: tokens.spacing.sm }}>
          <Typography variant="body" weight={isSelected ? '600' : '500'} numberOfLines={1}>
            {item.name}
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
            {tagInfo.type
              ? (
                  <Typography
                    variant="caption"
                    color={colors['c-primary']}
                    numberOfLines={1}
                    style={{ marginRight: tokens.spacing.xs }}
                  >
                    {tagInfo.text}
                  </Typography>
                )
              : null}
            {showSource
              ? (
                  <Typography
                    variant="caption"
                    color={semanticColors.textTertiary}
                    numberOfLines={1}
                    style={{ marginRight: tokens.spacing.xs }}
                  >
                    {item.source}
                  </Typography>
                )
              : null}
            <Typography variant="caption" color={semanticColors.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
              {singer}
            </Typography>
          </View>
        </View>
        {isShowInterval
          ? (
              <Typography variant="caption" color={semanticColors.textTertiary} numberOfLines={1} style={{ marginRight: tokens.spacing.sm }}>
                {item.interval}
              </Typography>
            )
          : null}
        <TouchableOpacity
          ref={moreButtonRef}
          onPress={handleShowMenu}
          accessibilityRole="button"
          accessibilityLabel="more actions"
          style={{
            width: 36,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="dots-vertical" style={{ color: semanticColors.textSecondary }} size={14} />
        </TouchableOpacity>
      </V2Pressable>
    </View>
  )
}

export default memo((props: ListItemProps) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  const theme = useTheme()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const tagInfo = useQualityTag(props.item)
  if (useModernUI) return <ModernListItem {...props} />

  const { item, index, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval } = props

  const isSelected = selectedList.includes(item)

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={{ ...styles.listItem, width: rowInfo.rowWidth, height: ITEM_HEIGHT, backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)' }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <Text numberOfLines={1}>{item.name}</Text>
          <View style={styles.listItemSingle}>
            { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
            { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
            <Text style={styles.listItemSingleText} size={11} color={theme['c-500']} numberOfLines={1}>{singer}</Text>
          </View>
        </View>
        {
          isShowInterval ? (
            <Text size={12} color={theme['c-250']} numberOfLines={1}>{item.interval}</Text>
          ) : null
        }
      </TouchableOpacity>
     <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton}>
        <Icon name="dots-vertical" style={{ color: theme['c-350'] }} size={12} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = createStyle({
  listItem: {
    // width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    // borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 38,
    // fontSize: 12,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 2,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
  // listItemTitle: {
  //   // backgroundColor: 'rgba(0,0,0,0.2)',
  //   flexGrow: 0,
  //   flexShrink: 1,
  //   // fontSize: 15,
  // },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    // alignItems: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  listItemTimeLabel: {
    marginRight: 5,
    fontWeight: '400',
  },
  listItemSingleText: {
    // fontSize: 13,
    // paddingTop: 2,
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
  },
  listItemBadge: {
    // fontSize: 10,
    paddingLeft: 5,
    paddingTop: 2,
    alignSelf: 'flex-start',
  },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },
  moreButton: {
    height: '80%',
    paddingLeft: 16,
    paddingRight: 16,
    // paddingTop: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
})
