import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import type { InitState as SearchState } from '@/store/search/state'
import type { Source as MusicSource } from '@/store/search/music/state'
import type { Source as SongListSource } from '@/store/search/songlist/state'

import MusicList, { type MusicListType } from '@/screens/Home/Views/Search/MusicList'
import SonglistList from '@/screens/Home/Views/Search/SonglistList'
import BlankView, { type BlankViewType } from './BlankView'

interface ListProps {
  onSearch: (keyword: string) => void
}

export interface ListType {
  loadList: (text: string, source: MusicSource | SongListSource, type: SearchState['searchType']) => void
}

/**
 * v2 搜索结果切换器:沿用 v1 MusicList / SonglistList(列表内部样式后续单独迭代),
 * 仅替换空态 BlankView 为 v2 卡片化版本。
 */
export default forwardRef<ListType, ListProps>(({ onSearch }, ref) => {
  const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [showBlankView, setShowBlankView] = useState(true)
  const listRef = useRef<MusicListType>(null)
  const blankRef = useRef<BlankViewType>(null)

  useImperativeHandle(ref, () => ({
    loadList(text, source, type) {
      if (text) {
        setShowBlankView(false)
        setListType(type)
        requestAnimationFrame(() => {
          listRef.current?.loadList(text, source)
        })
      } else {
        setShowBlankView(true)
        requestAnimationFrame(() => {
          blankRef.current?.show(source)
        })
      }
    },
  }), [])

  return (
    showBlankView
      ? <BlankView ref={blankRef} onSearch={onSearch} />
      : listType == 'songlist'
        ? <SonglistList ref={listRef} />
        : <MusicList ref={listRef} />
  )
})
