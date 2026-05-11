import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FlatList, RefreshControl, View, type FlatListProps } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { useLayout } from '@/utils/hooks'
import { scaleSizeW } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'
import { type ListInfoItem } from '@/store/songlist/state'

import { Typography } from '@/components/v2/atoms'
import ListItem from './ListItem'

const MIN_WIDTH = scaleSizeW(150)
const GAP = scaleSizeW(16)

export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'

export interface SonglistProps {
  onRefresh: () => void
  onLoadMore: () => void
}
export interface SonglistType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

type FlatListType = FlatListProps<ListInfoItem>
type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null

const Footer = ({ label, onLoadMore }: { label: FooterLabel, onLoadMore: () => void }) => {
  const { colors } = useDesignTokens()
  const t = useI18n()
  if (!label) return null
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    <View style={{ paddingVertical: 12 }}>
      <Typography
        variant="caption"
        color={colors['c-font-label']}
        onPress={handlePress}
        style={{ textAlign: 'center' }}
      >
        {t(label)}
      </Typography>
    </View>
  )
}

/**
 * v2 歌单网格:动态列数(MIN_WIDTH=150 → iPhone 2 列 / iPad 4 列)。
 */
export default forwardRef<SonglistType, SonglistProps>(({ onRefresh, onLoadMore }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setListState] = useState<ListInfoItem[]>([])
  const [showSource, setShowSource] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const { onLayout, width } = useLayout()

  useImperativeHandle(ref, () => ({
    setList(list, showSrc = false) {
      setListState(list)
      setShowSource(showSrc)
    },
    setStatus(val) { setStatus(val) },
  }))

  const handleOpenDetail = (item: ListInfoItem) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, item)
  }

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }

  const rowInfo = useMemo(() => {
    const w = width - GAP
    let n = width / (MIN_WIDTH + GAP)
    if (n > 10) n = 10
    const computedItemWidth = Math.floor(w / n)
    const num = Math.max(Math.floor(width / computedItemWidth), 2)
    return {
      num,
      width: (width - GAP) / num,
    }
  }, [width])

  const paddedList = useMemo(() => {
    const list = [...currentList]
    let placeholderCount = list.length % rowInfo.num
    if (placeholderCount > 0) placeholderCount = rowInfo.num - placeholderCount
    for (let i = 0; i < placeholderCount; i++) {
      list.push({
        id: `white__${i}`,
        play_count: '',
        author: '',
        name: '',
        img: '',
        desc: '',
        // @ts-expect-error placeholder filler row
        source: '',
      })
    }
    return list
  }, [currentList, rowInfo])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      width={rowInfo.width}
      showSource={showSource}
      onPress={handleOpenDetail}
    />
  )
  const getKey: FlatListType['keyExtractor'] = item => item.id

  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[colors['c-primary']]}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh}
    />
  ), [status, onRefresh, colors])

  const footer = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading': label = 'list_loading'; break
      case 'end': label = 'list_end'; break
      case 'error': label = 'list_error'; break
      case 'idle': label = null; break
    }
    return <Footer label={label} onLoadMore={onLoadMore} />
  }, [onLoadMore, status])

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      {width == 0
        ? null
        : (
            <FlatList
              key={String(rowInfo.num)}
              ref={flatListRef}
              style={{ flex: 1, paddingHorizontal: tokens.spacing.sm }}
              columnWrapperStyle={{ justifyContent: 'space-evenly' }}
              numColumns={rowInfo.num}
              data={paddedList}
              maxToRenderPerBatch={4}
              windowSize={8}
              removeClippedSubviews
              renderItem={renderItem}
              keyExtractor={getKey}
              onEndReachedThreshold={0.6}
              onEndReached={handleLoadMore}
              refreshControl={refreshControl}
              ListFooterComponent={footer}
            />
          )}
    </View>
  )
})
