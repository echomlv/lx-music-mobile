import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import SourceSelector, { type SourceSelectorType as _SourceSelectorType } from '@/components/SourceSelector'
import { useDesignTokens } from '@/theme/v2'
import { Surface } from '@/components/v2/atoms'
import { getBoardsList } from '@/core/leaderboard'
import { handleCollect, handlePlay } from '@/screens/Home/Views/Leaderboard/listAction'
import boardState, { type InitState } from '@/store/leaderboard/state'

import BoardsList, { type BoardsListProps, type BoardsListType } from '../BoardsList'

type Sources = Readonly<InitState['sources']>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface LeftBarProps {
  onChangeList: (source: LX.OnlineSource, id: string) => void
}

export interface LeftBarType {
  setBound: (source: LX.OnlineSource, id: string) => void
}

const LeftBar = forwardRef<LeftBarType, LeftBarProps>(({ onChangeList }, ref) => {
  const { colors, tokens } = useDesignTokens()
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const boardsListRef = useRef<BoardsListType>(null)
  const boundInfo = useRef<{ source: LX.OnlineSource, id: string | null }>({ source: 'kw', id: null })

  useImperativeHandle(ref, () => ({
    setBound(source, listId) {
      boundInfo.current = { source, id: listId }
      sourceSelectorRef.current?.setSourceList(boardState.sources, source)
      void getBoardsList(source).then(list => {
        boardsListRef.current?.setList(list, listId)
      })
    },
  }), [])

  const onSourceChange = (source: LX.OnlineSource) => {
    boundInfo.current.source = source
    void getBoardsList(source).then(list => {
      const id = list[0]?.id
      if (!id) return
      requestAnimationFrame(() => {
        boardsListRef.current?.setList(list, id)
        onChangeList(source, id)
      })
    })
  }

  const onBoundChange: BoardsListProps['onBoundChange'] = (id) => {
    boundInfo.current.id = id
    onChangeList(boundInfo.current.source, id)
  }
  const onPlay: BoardsListProps['onPlay'] = (id) => {
    boundInfo.current.id = id
    void handlePlay(id, boardState.listDetailInfo.list)
  }
  const onCollect: BoardsListProps['onCollect'] = (id, name) => {
    boundInfo.current.id = id
    void handleCollect(id, name, boundInfo.current.source)
  }

  return (
    <Surface
      variant="solid"
      radius="none"
      elevation="none"
      backgroundColor={colors['c-content-background']}
      style={{
        width: '26%',
        maxWidth: 220,
        minWidth: 150,
        flexGrow: 0,
        flexShrink: 0,
        borderRightWidth: 1,
        borderRightColor: colors['c-border-background'],
      }}
    >
      <View style={{ padding: tokens.spacing.sm }}>
        <View
          style={{
            height: 36,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: tokens.radius.pill,
            backgroundColor: colors['c-primary-light-200-alpha-700'],
            justifyContent: 'center',
          }}
        >
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center fontSize={13} />
        </View>
      </View>
      <BoardsList
        ref={boardsListRef}
        onBoundChange={onBoundChange}
        onPlay={onPlay}
        onCollect={onCollect}
      />
    </Surface>
  )
})

LeftBar.displayName = 'v2.Home.Leaderboard.Horizontal.LeftBar'

export default LeftBar
