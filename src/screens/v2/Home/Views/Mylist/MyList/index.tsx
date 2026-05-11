import { useEffect, useRef, useState } from 'react'

import ListMenu, { type ListMenuType } from '@/screens/Home/Views/Mylist/MyList/ListMenu'
import ListNameEdit, { type ListNameEditType } from '@/screens/Home/Views/Mylist/MyList/ListNameEdit'
import ListImportExport, { type ListImportExportType } from '@/screens/Home/Views/Mylist/MyList/ListImportExport'
import ListMusicSort, { type ListMusicSortType } from '@/screens/Home/Views/Mylist/MyList/ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from '@/screens/Home/Views/Mylist/MyList/DuplicateMusic'
import { handleRemove, handleSync } from '@/screens/Home/Views/Mylist/MyList/listAction'

import List from './List'

/**
 * v2 Mylist 左侧抽屉:替换 List 为分区卡片,其余弹层逻辑全部复用 v1。
 */
export default () => {
  const [visible, setVisible] = useState(false)
  const listMenuRef = useRef<ListMenuType>(null)
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)

  useEffect(() => {
    let isInited = false
    const changeVisible = (visibleList: boolean) => {
      if (visibleList && !isInited) {
        requestAnimationFrame(() => { setVisible(true) })
        isInited = true
      }
    }
    global.app_event.on('changeLoveListVisible', changeVisible)
    return () => {
      global.app_event.off('changeLoveListVisible', changeVisible)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      <List onShowMenu={(info, position) => listMenuRef.current?.show(info, position)} />
      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
      <ListMenu
        ref={listMenuRef}
        onNew={index => listNameEditRef.current?.showCreate(index)}
        onRename={info => listNameEditRef.current?.show(info)}
        onSort={info => listMusicSortRef.current?.show(info)}
        onDuplicateMusic={info => duplicateMusicRef.current?.show(info)}
        onImport={(info, position) => listImportExportRef.current?.import(info, position)}
        onExport={(info, position) => listImportExportRef.current?.export(info, position)}
        onRemove={info => { handleRemove(info) }}
        onSync={info => { handleSync(info) }}
        onSelectLocalFile={(info, position) => listImportExportRef.current?.selectFile(info, position)}
      />
    </>
  )
}
