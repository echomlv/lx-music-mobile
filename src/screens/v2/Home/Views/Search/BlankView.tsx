import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'

import { getList as getHotList } from '@/core/hotSearch'
import { type Source as HotSource, type InitState as HotState } from '@/store/hotSearch/state'
import { clearHistoryList, getSearchHistory, removeHistoryWord } from '@/core/search/search'

import { IconButton, Typography, V2Pressable } from '@/components/v2/atoms'

type HotList = NonNullable<HotState['sourceList'][keyof HotState['sourceList']]>
type Source = LX.OnlineSource | 'all'

interface BlankViewProps {
  onSearch: (keyword: string) => void
}

export interface BlankViewType {
  show: (source: Source) => void
}

const Chip = ({ keyword, onPress, onLongPress }: {
  keyword: string
  onPress: (k: string) => void
  onLongPress?: (k: string) => void
}) => {
  const { colors, tokens } = useDesignTokens()
  return (
    <V2Pressable
      onPress={() => { onPress(keyword) }}
      onLongPress={onLongPress ? () => { onLongPress(keyword) } : undefined}
      style={{
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.xs,
        borderRadius: tokens.radius.pill,
        backgroundColor: colors['c-button-background'],
      }}
    >
      <Typography variant="label" color={colors['c-button-font']}>{keyword}</Typography>
    </V2Pressable>
  )
}

const SectionHeader = ({ title, right }: { title: string, right?: React.ReactNode }) => {
  const { tokens } = useDesignTokens()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: tokens.spacing.sm,
      }}
    >
      <Typography variant="subtitle" weight="600">{title}</Typography>
      {right}
    </View>
  )
}

const HotSection = ({ data, onSearch }: { data: HotList, onSearch: (k: string) => void }) => {
  const t = useI18n()
  const { tokens } = useDesignTokens()
  if (!data.length) return null
  return (
    <View style={{ marginTop: tokens.spacing.lg }}>
      <SectionHeader title={t('search_hot_search')} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.sm,
        }}
      >
        {data.map(k => (<Chip key={k} keyword={k} onPress={onSearch} />))}
      </View>
    </View>
  )
}

const HistorySection = ({ data, onSearch, onClear, onRemove }: {
  data: string[]
  onSearch: (k: string) => void
  onClear: () => void
  onRemove: (k: string) => void
}) => {
  const t = useI18n()
  const { tokens } = useDesignTokens()
  if (!data.length) return null
  return (
    <View style={{ marginTop: tokens.spacing.lg }}>
      <SectionHeader
        title={t('search_history_search')}
        right={(
          <IconButton
            name="eraser"
            size={14}
            hitSize={32}
            radius="pill"
            onPress={onClear}
            accessibilityLabel="clear history"
          />
        )}
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.sm,
        }}
      >
        {data.map(k => (<Chip key={k} keyword={k} onPress={onSearch} onLongPress={onRemove} />))}
      </View>
    </View>
  )
}

/**
 * v2 搜索空态:热门关键词 + 历史搜索,均以 pill chip 呈现。
 */
export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const [hot, setHot] = useState<HotList>([])
  const [history, setHistory] = useState<string[]>([])
  const isShowHotSearch = useSettingValue('search.isShowHotSearch')
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => { isUnmountedRef.current = true }
  }, [])

  const load = useCallback((source: Source) => {
    if (isShowHotSearch) {
      void getHotList(source as HotSource).then(list => {
        if (isUnmountedRef.current) return
        setHot(list)
      })
    }
    if (isShowHistorySearch) {
      void getSearchHistory().then(list => {
        if (isUnmountedRef.current) return
        setHistory(list)
      })
    }
  }, [isShowHotSearch, isShowHistorySearch])

  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) load(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => { load(source) })
      }
    },
  }), [visible, load])

  const handleClear = useCallback(() => {
    clearHistoryList()
    setHistory([])
  }, [])

  const handleRemove = useCallback((keyword: string) => {
    setHistory(list => {
      const next = [...list]
      const index = next.indexOf(keyword)
      if (index >= 0) {
        next.splice(index, 1)
        removeHistoryWord(index)
      }
      return next
    })
  }, [])

  if (!visible) return null
  if (!isShowHotSearch && !isShowHistorySearch) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="title" color={colors['c-font-label']}>
          {t('search__welcome')}
        </Typography>
      </View>
    )
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{
        paddingHorizontal: tokens.spacing.lg,
        paddingBottom: tokens.spacing.xxl,
      }}
    >
      <HotSection data={hot} onSearch={onSearch} />
      <HistorySection
        data={history}
        onSearch={onSearch}
        onClear={handleClear}
        onRemove={handleRemove}
      />
    </ScrollView>
  )
})
