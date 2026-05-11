import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { clearList, getList, setList, setListInfo } from '@/core/songlist'
import songlistState, { type Source } from '@/store/songlist/state'

import Songlist, { type SonglistType, type SonglistProps } from './components/Songlist'

export interface ListType {
  loadList: (source: Source, sortId: string, tagId: string) => void
}

/**
 * v2 列表数据装载层:逻辑沿用 v1 List.tsx,仅替换内层 Songlist 视觉。
 */
export default forwardRef<ListType, {}>((_, ref) => {
  const listRef = useRef<SonglistType>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => { isUnmountedRef.current = true }
  }, [])

  useImperativeHandle(ref, () => ({
    async loadList(source, sortId, tagId) {
      const listInfo = songlistState.listInfo
      listRef.current?.setList([])
      if (listInfo.tagId == tagId && listInfo.sortId == sortId && listInfo.source == source && listInfo.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(listInfo.list)
        })
        return
      }
      listRef.current?.setStatus('loading')
      setListInfo(source, tagId, sortId)
      const page = 1
      return getList(source, tagId, sortId, page).then((info) => {
        const result = setList(info, tagId, sortId, page)
        if (isUnmountedRef.current) return
        requestAnimationFrame(() => {
          listRef.current?.setList(result.list)
          listRef.current?.setStatus(songlistState.listInfo.maxPage <= page ? 'end' : 'idle')
        })
      }).catch(() => {
        if (songlistState.listInfo.list.length && page == 1) clearList()
        listRef.current?.setStatus('error')
      })
    },
  }), [])

  const handleRefresh: SonglistProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getList(songlistState.listInfo.source, songlistState.listInfo.tagId, songlistState.listInfo.sortId, page, true).then((info) => {
      const result = setList(info, songlistState.listInfo.tagId, songlistState.listInfo.sortId, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(songlistState.listInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listInfo.list.length && page == 1) clearList()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: SonglistProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = songlistState.listInfo.list.length ? songlistState.listInfo.page + 1 : 1
    getList(songlistState.listInfo.source, songlistState.listInfo.tagId, songlistState.listInfo.sortId, page).then((info) => {
      const result = setList(info, songlistState.listInfo.tagId, songlistState.listInfo.sortId, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(songlistState.listInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listInfo.list.length && page == 1) clearList()
      listRef.current?.setStatus('error')
    })
  }

  return (
    <Songlist
      ref={listRef}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
    />
  )
})
