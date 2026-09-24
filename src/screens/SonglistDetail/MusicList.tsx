import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, View, type LayoutChangeEvent } from 'react-native'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { handlePlay } from './listAction'
import Header, { type DetailInfo, type HeaderType } from './Header'
import { useListInfo } from './state'
import { useHorizontalMode } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import { isHorizontalMode } from '@/utils/tools'

// 部分音源的歌单简介是 HTML:<br> 转为换行,其余标签去掉
const formatDesc = (desc: string) => desc.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()

export interface MusicListProps {
  componentId: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string, hostUin?: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ componentId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const headerRef = useRef<HeaderType>(null)
  const isUnmountedRef = useRef(false)
  const hostUinRef = useRef<string | undefined>()
  const info = useListInfo()
  const detailInfoRef = useRef<DetailInfo>()
  const useModernUI = useSettingValue('theme.useModernUI')
  const { colors } = useDesignTokens()
  // 按页面容器自身的实际尺寸判断横竖屏:iOS 旋转后全局窗口尺寸的 Hook 在本页可能停留在旧值,
  // 而容器的 onLayout 由原生布局驱动,旋转后一定会触发。首次布局前先用全局判断作为初始值
  const isHorizontalInit = useHorizontalMode()
  const [isHorizontal, setHorizontal] = useState(isHorizontalInit)
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    if (!width || !height) return
    setHorizontal(isHorizontalMode(width, height))
  }
  // 现代 UI 横屏时歌单信息放在左侧固定栏,歌曲列表占右侧
  const isSideLayout = useModernUI && isHorizontal

  const setHeaderInfo = (detailInfo: DetailInfo) => {
    detailInfo = { ...detailInfo, desc: formatDesc(detailInfo.desc) }
    detailInfoRef.current = detailInfo
    headerRef.current?.setInfo(detailInfo)
  }

  useImperativeHandle(ref, () => ({
    async loadList(source, id, hostUin) {
      hostUinRef.current = hostUin
      clearListDetail()
      const listDetailInfo = songlistState.listDetailInfo
      listRef.current?.setList([])
      if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(listDetailInfo.list)
          setHeaderInfo({
            name: (info.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info.desc || '',
            playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info.img ?? listDetailInfo.info.img,
          })
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        setListDetailInfo(info.source, info.id)
        setHeaderInfo({
          name: (info.name || listDetailInfo.info.name) ?? '',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          desc: listDetailInfo.info.desc || info.desc || '',
          playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
          imgUrl: info.img ?? listDetailInfo.info.img,
        })
        return getListDetail(id, source, page, false, hostUinRef.current).then((listDetail) => {
          const result = setListDetail(listDetail, id, page)
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            setHeaderInfo({
              name: (info.name || listDetailInfo.info.name) ?? '',
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              desc: listDetailInfo.info.desc || info.desc || '',
              playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
              imgUrl: info.img ?? listDetailInfo.info.img,
            })
            listRef.current?.setList(result.list)
            listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
          listRef.current?.setStatus('error')
        })
      }
    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    // console.log(songlistState.listDetailInfo)
    void handlePlay(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list, index)
  }
  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page, true, hostUinRef.current).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = songlistState.listDetailInfo.list.length ? songlistState.listDetailInfo.page + 1 : 1
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page, false, hostUinRef.current).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list, true)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  // 布局切换时 Header 会换位置重新挂载,用 detailInfoRef 恢复已加载的信息
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const header = useMemo(() => <Header ref={headerRef} componentId={componentId} side={isSideLayout} initInfo={detailInfoRef.current} />, [isSideLayout])

  // 两种布局保持相同的节点结构,切换横竖屏时 OnlineList 不会重新挂载而丢失已加载的列表
  return (
    <View style={{ flex: 1, flexDirection: isSideLayout ? 'row' : 'column' }} onLayout={handleLayout}>
      {isSideLayout
        ? (
            <View style={{ width: '30%', minWidth: 220, maxWidth: 360, borderRightWidth: 1, borderRightColor: colors['c-border-background'] }}>
              <ScrollView>{header}</ScrollView>
            </View>
          )
        : null}
      <View style={{ flex: 1 }}>
        <OnlineList
          ref={listRef}
          onPlayList={handlePlayList}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          ListHeaderComponent={isSideLayout ? null : header}
          // progressViewOffset={}
        />
      </View>
    </View>
  )
})
