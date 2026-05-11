import { useEffect, useRef } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { createStyle } from '@/utils/tools'
import { addHistoryWord } from '@/core/search/search'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'

import searchState, { type SearchType } from '@/store/search/state'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState from '@/store/search/songlist/state'

import TipList, { type TipListType } from '@/screens/Home/Views/Search/TipList'
import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import List, { type ListType } from './List'

interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

/**
 * v2 搜索页:沿用 v1 数据通路(searchState / store actions / TipList),
 * 仅替换 HeaderBar(pill 搜索条)+ 空态卡片化(BlankView)。
 */
export default () => {
  const { colors } = useDesignTokens()
  const headerBarRef = useRef<HeaderBarType>(null)
  const tipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)
  const layoutHeightRef = useRef<number>(0)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    void getSearchSetting().then(info => {
      searchInfo.current.temp_source = info.temp_source
      searchInfo.current.source = info.source
      searchInfo.current.searchType = info.type
      switch (info.type) {
        case 'music':
          headerBarRef.current?.setSourceList(searchMusicState.sources, info.source)
          break
        case 'songlist':
          headerBarRef.current?.setSourceList(searchSonglistState.sources, info.source)
          break
      }
      headerBarRef.current?.setText(searchState.searchText)
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, searchInfo.current.searchType)
    })

    const handleTypeChange = (type: SearchType) => {
      searchInfo.current.searchType = type
      void saveSearchSetting({ type })
      listRef.current?.loadList(searchState.searchText, searchInfo.current.source, type)
    }
    global.app_event.on('searchTypeChanged', handleTypeChange)
    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
    }
  }, [])

  const handleLayout = (e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    searchInfo.current.source = source
    void saveSearchSetting({ source })
    listRef.current?.loadList(searchState.searchText, source, searchInfo.current.searchType)
  }
  const handleTipSearch: HeaderBarProps['onTipSearch'] = (text) => {
    setTimeout(() => {
      tipListRef.current?.search(text, layoutHeightRef.current)
    }, 500)
  }
  const handleHideTipList = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    tipListRef.current?.hide()
  }
  const handleSearch: HeaderBarProps['onSearch'] = (text) => {
    handleHideTipList()
    tipListRef.current?.search(text, layoutHeightRef.current)
    headerBarRef.current?.setText(text)
    headerBarRef.current?.blur()
    void addHistoryWord(text)
    listRef.current?.loadList(text, searchInfo.current.source, searchInfo.current.searchType)
  }
  const handleShowTipList: HeaderBarProps['onShowTipList'] = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      tipListRef.current?.show(layoutHeightRef.current)
    }, 500)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors['c-content-background'] }]}>
      <HeaderBar
        ref={headerBarRef}
        onSourceChange={handleSourceChange}
        onTipSearch={handleTipSearch}
        onSearch={handleSearch}
        onHideTipList={handleHideTipList}
        onShowTipList={handleShowTipList}
      />
      <View style={styles.content} onLayout={handleLayout}>
        <TipList ref={tipListRef} onSearch={handleSearch} />
        <List ref={listRef} onSearch={handleSearch} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})
