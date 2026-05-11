import { memo, useEffect, useMemo, useRef } from 'react'
import { FlatList, TouchableOpacity, View, type FlatListProps, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { useActiveListId, useListFetching, useMyList } from '@/store/list/hook'
import { LIST_IDS, LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getListPosition, saveListPosition } from '@/utils/data'
import { setActiveList } from '@/core/list'

import { Icon } from '@/components/common/Icon'
import Loading from '@/components/common/Loading'
import { Typography, V2Pressable } from '@/components/v2/atoms'
import { type Position } from '@/screens/Home/Views/Mylist/MyList/ListMenu'

const ITEM_HEIGHT = 48

type SectionId = 'system' | 'user'
type Row =
  | { kind: 'header', section: SectionId, key: string }
  | { kind: 'item', section: SectionId, key: string, item: LX.List.MyListInfo, indexInAll: number }

type RowListProps = FlatListProps<Row>

const SectionHeader = memo(({ label }: { label: string }) => {
  const { colors, tokens } = useDesignTokens()
  return (
    <View
      style={{
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: tokens.spacing.md,
        paddingBottom: tokens.spacing.xs,
      }}
    >
      <Typography
        variant="caption"
        weight="600"
        color={colors['c-font-label']}
        style={{ letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Typography>
    </View>
  )
})
SectionHeader.displayName = 'v2.Mylist.SectionHeader'

const ListRow = memo(({ item, indexInAll, activeId, onPress, onShowMenu }: {
  item: LX.List.MyListInfo
  indexInAll: number
  activeId: string
  onPress: (item: LX.List.MyListInfo) => void
  onShowMenu: (item: LX.List.MyListInfo, index: number, position: Position) => void
}) => {
  const { colors, tokens } = useDesignTokens()
  const moreBtnRef = useRef<TouchableOpacity>(null)
  const fetching = useListFetching(item.id)
  const active = activeId === item.id

  const handleShowMenu = () => {
    moreBtnRef.current?.measure?.((_fx, _fy, w, h, px, py) => {
      onShowMenu(item, indexInAll, {
        x: Math.ceil(px),
        y: Math.ceil(py),
        w: Math.ceil(w),
        h: Math.ceil(h),
      })
    })
  }

  return (
    <View
      style={{
        height: ITEM_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: tokens.spacing.md,
        paddingLeft: tokens.spacing.sm,
        paddingRight: tokens.spacing.xs,
        borderRadius: tokens.radius.md,
        backgroundColor: active ? colors['c-primary-light-200-alpha-700'] : 'transparent',
      }}
    >
      <View style={{ width: 18, alignItems: 'center' }}>
        {active
          ? <Icon name="chevron-right" size={12} color={colors['c-primary']} />
          : null}
      </View>
      {fetching
        ? <Loading color={active ? colors['c-primary'] : colors['c-font']} style={{ marginLeft: 4 }} />
        : null}
      <V2Pressable
        onPress={() => { onPress(item) }}
        style={{
          flex: 1,
          height: '100%',
          justifyContent: 'center',
          paddingLeft: tokens.spacing.sm,
        }}
      >
        <Typography
          variant="body"
          weight={active ? '600' : '500'}
          color={active ? colors['c-primary'] : colors['c-font']}
          numberOfLines={1}
        >
          {item.name}
        </Typography>
      </V2Pressable>
      <TouchableOpacity
        ref={moreBtnRef}
        onPress={handleShowMenu}
        style={{
          width: 36,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="dots-vertical" color={colors['c-350']} size={14} />
      </TouchableOpacity>
    </View>
  )
}, (prev, next) => {
  return prev.item === next.item
    && prev.indexInAll === next.indexInAll
    && prev.item.name === next.item.name
    && prev.activeId !== prev.item.id
    && next.activeId !== next.item.id
})
ListRow.displayName = 'v2.Mylist.ListRow'

/**
 * v2 抽屉列表:分两个 section,系统(默认 + 收藏)+ 自建,
 * section header 极简弱字色 caption,行高 48,无分割线、轻底色。
 */
export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const t = useI18n()
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()
  const activeListId = useActiveListId()

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = []
    const system: LX.List.MyListInfo[] = []
    const user: LX.List.MyListInfo[] = []
    for (const it of allList) {
      if (it.id === LIST_IDS.DEFAULT || it.id === LIST_IDS.LOVE) system.push(it)
      else user.push(it)
    }

    if (system.length) {
      r.push({ kind: 'header', section: 'system', key: 'header_system' })
      system.forEach((it, idx) => {
        const indexInAll = allList.indexOf(it)
        r.push({ kind: 'item', section: 'system', key: `system_${it.id}`, item: it, indexInAll })
      })
    }
    if (user.length) {
      r.push({ kind: 'header', section: 'user', key: 'header_user' })
      user.forEach(it => {
        const indexInAll = allList.indexOf(it)
        r.push({ kind: 'item', section: 'user', key: `user_${it.id}`, item: it, indexInAll })
      })
    }
    return r
  }, [allList])

  const handleToggleList = (item: LX.List.MyListInfo) => {
    global.app_event.changeLoveListVisible(false)
    requestAnimationFrame(() => { setActiveList(item.id) })
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    void saveListPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }

  const showMenu = (listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }

  useEffect(() => {
    void getListPosition(LIST_SCROLL_POSITION_KEY).then((offset) => {
      flatListRef.current?.scrollToOffset({ offset, animated: false })
    })
  }, [])

  const renderItem: RowListProps['renderItem'] = ({ item }) => {
    if (item.kind === 'header') {
      return (
        <SectionHeader label={item.section === 'system' ? t('mylist_section_system') : t('mylist_section_user')} />
      )
    }
    return (
      <ListRow
        item={item.item}
        indexInAll={item.indexInAll}
        activeId={activeListId}
        onPress={handleToggleList}
        onShowMenu={showMenu}
      />
    )
  }
  const getKey: RowListProps['keyExtractor'] = row => row.key

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      data={rows}
      maxToRenderPerBatch={12}
      windowSize={9}
      removeClippedSubviews
      initialNumToRender={24}
      renderItem={renderItem}
      keyExtractor={getKey}
      style={{ flex: 1 }}
    />
  )
}
