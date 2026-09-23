import { getSongListSetting, saveSongListSetting } from '@/utils/data'
import { getTagType } from '@/core/songlist'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

// import List from './List/List'
import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import songlistState, { type InitState, type SortInfo } from '@/store/songlist/state'
import List, { type ListType } from './List'


interface SonglistInfo {
  source: InitState['sources'][number]
  sortId: SortInfo['id']
  tagId: string
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const listRef = useRef<ListType>(null)
  const songlistInfo = useRef<SonglistInfo>({ source: 'kw', sortId: '5', tagId: '' })

  useEffect(() => {
    void getSongListSetting().then(info => {
      // 已保存的排序可能已被移除(如 tx 旧的「最热」「最新」),回退为该源的第一个排序
      const sortList = songlistState.sortList[info.source]
      if (sortList?.length && !sortList.some(s => s.id == info.sortId)) {
        info.sortId = sortList[0].id
        void saveSongListSetting({ sortId: info.sortId })
      }
      songlistInfo.current.source = info.source
      songlistInfo.current.sortId = info.sortId
      songlistInfo.current.tagId = info.tagId
      headerBarRef.current?.setSource(info.source, info.sortId, info.tagName, info.tagId)
      listRef.current?.loadList(info.source, info.sortId, info.tagId)
    })
  }, [])

  const handleSortChange: HeaderBarProps['onSortChange'] = (id) => {
    const { source, sortId: prevSortId } = songlistInfo.current
    // 排序切换导致分类体系变化(如网易「曲风」)时,原分类 id 不再适用,重置为默认分类
    const resetTag = getTagType(source, prevSortId) != getTagType(source, id)
    songlistInfo.current.sortId = id
    if (resetTag) {
      songlistInfo.current.tagId = ''
      void saveSongListSetting({ sortId: id, tagId: '', tagName: '' })
    } else void saveSongListSetting({ sortId: id })
    headerBarRef.current?.setSortId(id, resetTag)
    listRef.current?.loadList(source, id, songlistInfo.current.tagId)
  }

  const handleTagChange: HeaderBarProps['onTagChange'] = (name, id) => {
    songlistInfo.current.tagId = id
    void saveSongListSetting({ tagName: name, tagId: id })
    listRef.current?.loadList(songlistInfo.current.source, songlistInfo.current.sortId, id)
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    songlistInfo.current.source = source
    songlistInfo.current.tagId = ''
    songlistInfo.current.sortId = songlistState.sortList[source]![0].id
    void saveSongListSetting({ sortId: songlistInfo.current.sortId, source, tagId: '', tagName: '' })
    headerBarRef.current?.setSource(source, songlistInfo.current.sortId, '', songlistInfo.current.tagId)
    listRef.current?.loadList(source, songlistInfo.current.sortId, songlistInfo.current.tagId)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSortChange={handleSortChange}
        onTagChange={handleTagChange}
        onSourceChange={handleSourceChange}
      />
      <List ref={listRef} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
})

