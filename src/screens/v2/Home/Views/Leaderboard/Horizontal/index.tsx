import { useEffect, useRef } from 'react'
import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { createStyle } from '@/utils/tools'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import { getBoardsList } from '@/core/leaderboard'
import { type BoardItem } from '@/store/leaderboard/state'

import MusicList, { type MusicListType } from '@/screens/Home/Views/Leaderboard/MusicList'
import LeftBar, { type LeftBarType, type LeftBarProps } from './LeftBar'

const resolveBoardId = (list: BoardItem[], boardId: string | null) => {
  if (!list.length) return null
  return list.some(item => item.id == boardId) ? boardId : list[0].id
}

export default () => {
  const { colors } = useDesignTokens()
  const leftBarRef = useRef<LeftBarType>(null)
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)

  const handleChangeBound: LeftBarProps['onChangeList'] = (source, id) => {
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({ source, boardId: id })
  }

  useEffect(() => {
    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      void getBoardsList(source).then(list => {
        const resolvedId = resolveBoardId(list, boardId)
        if (!resolvedId || isUnmountedRef.current) return
        leftBarRef.current?.setBound(source, resolvedId)
        musicListRef.current?.loadList(source, resolvedId)
        if (resolvedId != boardId) void saveLeaderboardSetting({ source, boardId: resolvedId })
      })
    })

    return () => { isUnmountedRef.current = true }
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors['c-content-background'] }]}>
      <LeftBar ref={leftBarRef} onChangeList={handleChangeBound} />
      <View style={styles.content}>
        <MusicList ref={musicListRef} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
})
