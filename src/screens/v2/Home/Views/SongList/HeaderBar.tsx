import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ScrollView, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import commonState from '@/store/common/state'
import songlistState, { type Source, type SortInfo, type InitState } from '@/store/songlist/state'
import { navigations } from '@/navigation'
import { isTagDisabled } from '@/core/songlist'

import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import { IconButton, Typography, V2Pressable } from '@/components/v2/atoms'
import OpenListModal, { type ModalType as OpenListModalType } from '@/screens/Home/Views/SongList/HeaderBar/OpenList/Modal'

type Sources = Readonly<InitState['sources']>
type SourceSelectorCommonProps = _SourceSelectorProps<Sources>
type SourceSelectorCommonType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSortChange: (id: string) => void
  onTagChange: (name: string, id: string) => void
  onSourceChange: SourceSelectorCommonProps['onSourceChange']
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string, tagName: string, tagId: string) => void
  setSortId: (sortId: string, resetTag: boolean) => void
}

// ---------------- Source chip ----------------

const SourceChip = forwardRef<{ setSource: (s: Source) => void }, {
  onSourceChange: SourceSelectorCommonProps['onSourceChange']
}>(({ onSourceChange }, ref) => {
    const { colors, tokens } = useDesignTokens()
    const sourceSelectorRef = useRef<SourceSelectorCommonType>(null)

    useImperativeHandle(ref, () => ({
      setSource(source) {
        sourceSelectorRef.current?.setSourceList(songlistState.sources, source)
      },
    }), [])

    return (
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
    )
  })
SourceChip.displayName = 'v2.SongList.SourceChip'

// ---------------- Sort tab ----------------

interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}

const SortTab = forwardRef<SortTabType, { onSortChange: (id: string) => void }>(({ onSortChange }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const scrollRef = useRef<ScrollView>(null)
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      scrollRef.current?.scrollTo({ x: 0 })
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const items = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handlePress = (id: string) => {
    setActiveId(id)
    onSortChange(id)
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{
        alignItems: 'center',
        gap: tokens.spacing.xs,
        paddingHorizontal: tokens.spacing.md,
      }}
      style={{ flexGrow: 1 }}
    >
      {items.map(item => {
        const active = activeId === item.id
        return (
          <V2Pressable
            key={item.id}
            onPress={() => { handlePress(item.id) }}
            style={{
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: 6,
              borderRadius: tokens.radius.pill,
              backgroundColor: active ? colors['c-primary'] : colors['c-button-background'],
            }}
          >
            <Typography
              variant="label"
              weight={active ? '600' : '500'}
              color={active ? colors['c-primary-light-1000'] : colors['c-button-font']}
            >
              {item.label}
            </Typography>
          </V2Pressable>
        )
      })}
    </ScrollView>
  )
})
SortTab.displayName = 'v2.SongList.SortTab'

// ---------------- Tag chip ----------------

interface TagChipType {
  setSelectedTagInfo: (source: Source, name: string, activeId: string, sortId: string) => void
  /** 切换排序;resetTag 为 true 时(分类体系改变)重置为默认分类 */
  setSortId: (sortId: string, resetTag: boolean) => void
}

const TagChip = forwardRef<TagChipType, { onTagChange: (name: string, id: string) => void }>(({ onTagChange }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const [name, setName] = useState('')
  // 当前排序不支持分类时置灰并显示为默认
  const [disabled, setDisabled] = useState(false)
  const infoRef = useRef<{ source: Source, activeId: string, sortId: string }>({ source: 'kw', activeId: '', sortId: '' })

  useEffect(() => {
    const handleChange = (name: string, id: string) => {
      onTagChange(name, id)
      infoRef.current.activeId = id
      setName(name)
    }
    global.app_event.on('songlistTagInfoChange', handleChange)
    return () => {
      global.app_event.off('songlistTagInfoChange', handleChange)
    }
  }, [onTagChange])

  useImperativeHandle(ref, () => ({
    setSelectedTagInfo(source, n, activeId, sortId) {
      infoRef.current.activeId = activeId
      infoRef.current.source = source
      infoRef.current.sortId = sortId
      setName(n)
      setDisabled(isTagDisabled(source, sortId))
    },
    setSortId(sortId, resetTag) {
      infoRef.current.sortId = sortId
      setDisabled(isTagDisabled(infoRef.current.source, sortId))
      if (!resetTag) return
      infoRef.current.activeId = ''
      setName('')
    },
  }))

  const display = disabled || !name ? t('songlist_tag_default') : name
  const selected = !disabled && !!name

  const handleShow = () => {
    global.app_event.showSonglistTagList(infoRef.current.source, infoRef.current.activeId, infoRef.current.sortId)
  }

  return (
    <V2Pressable
      onPress={handleShow}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.4 : 1,
        height: 32,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors['c-primary'] : colors['c-border-background'],
        backgroundColor: selected ? colors['c-primary-light-200-alpha-700'] : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xxs,
      }}
    >
      <Typography
        variant="label"
        weight="500"
        numberOfLines={1}
        color={selected ? colors['c-primary'] : undefined}
      >
        {display}
      </Typography>
    </V2Pressable>
  )
})
TagChip.displayName = 'v2.SongList.TagChip'

// ---------------- Open list button ----------------

interface OpenListType {
  setInfo: (source: Source) => void
}

const OpenList = forwardRef<OpenListType, {}>((_, ref) => {
  const modalRef = useRef<OpenListModalType>(null)
  const songlistInfoRef = useRef<{ source: Source }>({ source: 'kw' })

  useImperativeHandle(ref, () => ({
    setInfo(source) { songlistInfoRef.current.source = source },
  }))

  const handleOpenSonglist = (id: string) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, {
      play_count: undefined,
      id,
      author: '',
      name: '',
      img: undefined,
      desc: undefined,
      source: songlistInfoRef.current.source,
    })
  }

  return (
    <>
      <IconButton
        name="add_folder"
        size={18}
        hitSize={36}
        radius="pill"
        onPress={() => modalRef.current?.show(songlistInfoRef.current.source)}
        accessibilityLabel="open songlist by id"
      />
      <OpenListModal ref={modalRef} onOpenId={handleOpenSonglist} />
    </>
  )
})
OpenList.displayName = 'v2.SongList.OpenList'

// ---------------- HeaderBar ----------------

export default memo(forwardRef<HeaderBarType, HeaderBarProps>(({
  onSortChange,
  onTagChange,
  onSourceChange,
}, ref) => {
  const { colors, tokens } = useDesignTokens()
  const sourceRef = useRef<{ setSource: (s: Source) => void }>(null)
  const sortRef = useRef<SortTabType>(null)
  const tagRef = useRef<TagChipType>(null)
  const openRef = useRef<OpenListType>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, sortId, tagName, tagId) {
      sourceRef.current?.setSource(source)
      sortRef.current?.setSource(source, sortId)
      tagRef.current?.setSelectedTagInfo(source, tagName, tagId, sortId)
      openRef.current?.setInfo(source)
    },
    setSortId(sortId, resetTag) {
      tagRef.current?.setSortId(sortId, resetTag)
    },
  }), [])

  return (
    <View
      style={{
        backgroundColor: colors['c-content-background'],
        paddingTop: tokens.spacing.sm,
        paddingBottom: tokens.spacing.xs,
        gap: tokens.spacing.xs,
        zIndex: 2,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing.md,
          gap: tokens.spacing.sm,
        }}
      >
        <SourceChip ref={sourceRef} onSourceChange={onSourceChange} />
        <TagChip ref={tagRef} onTagChange={onTagChange} />
        <View style={{ flex: 1 }} />
        <OpenList ref={openRef} />
      </View>
      <SortTab ref={sortRef} onSortChange={onSortChange} />
    </View>
  )
}))
