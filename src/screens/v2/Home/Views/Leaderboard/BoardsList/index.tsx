import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import { type BoardItem } from '@/store/leaderboard/state'
import ListMenu, { type ListMenuType, type Position } from '@/screens/Home/Views/Leaderboard/BoardsList/ListMenu'
import List, { type ListType, type ListProps } from './List'

export interface BoardsListProps {
  onBoundChange: (listId: string) => void
  onPlay: (listId: string) => void
  onCollect: (listId: string, name: string) => void
}
export interface BoardsListType {
  setList: (list: BoardItem[], activeId: string) => void
}

/**
 * v2 排行榜 drawer:沿用 v1 ListMenu 弹层,仅 List 视觉改 v2。
 */
export default forwardRef<BoardsListType, BoardsListProps>(({ onBoundChange, onPlay, onCollect }, ref) => {
  const listRef = useRef<ListType>(null)
  const listMenuRef = useRef<ListMenuType>(null)

  useImperativeHandle(ref, () => ({
    setList(list, listId) {
      listRef.current?.setList(list, listId)
    },
  }), [])

  const handleShowMenu: ListProps['onShowMenu'] = ({ listId, name, index }, position: Position) => {
    listMenuRef.current?.show({ listId, index, name }, position)
  }

  return (
    <View style={styles.container}>
      <List ref={listRef} onBoundChange={onBoundChange} onShowMenu={handleShowMenu} />
      <ListMenu
        ref={listMenuRef}
        onHideMenu={() => listRef.current?.hideMenu()}
        onPlay={({ listId }) => { onPlay(listId) }}
        onCollect={({ listId, name }) => { onCollect(listId, name) }}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
})
