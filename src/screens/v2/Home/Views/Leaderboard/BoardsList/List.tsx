import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { type BoardItem } from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'
import Button, { type BtnType } from '@/components/common/Button'
import { Typography } from '@/components/v2/atoms'
import { type Position } from '@/screens/Home/Views/Leaderboard/BoardsList/ListMenu'

export interface ListProps {
  onBoundChange: (listId: string) => void
  onShowMenu: (info: { listId: string, name: string, index: number }, position: Position) => void
}
export interface ListType {
  setList: (list: BoardItem[], activeId: string) => void
  hideMenu: () => void
}

const Row = ({ item, index, active, longPressed, onPress, onLongPress }: {
  item: BoardItem
  index: number
  active: boolean
  longPressed: boolean
  onPress: (item: BoardItem) => void
  onLongPress: (item: BoardItem, index: number, ref: BtnType | null) => void
}) => {
  const { colors, tokens } = useDesignTokens()
  const buttonRef = useRef<BtnType>(null)

  return (
    <Button
      ref={buttonRef}
      onPress={() => { onPress(item) }}
      onLongPress={() => { onLongPress(item, index, buttonRef.current) }}
      style={{
        marginHorizontal: tokens.spacing.sm,
        marginVertical: 2,
        paddingHorizontal: tokens.spacing.sm,
        paddingVertical: tokens.spacing.sm + 2,
        borderRadius: tokens.radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: longPressed
          ? colors['c-button-background-active']
          : active
            ? colors['c-primary-light-200-alpha-700']
            : 'transparent',
      }}
    >
      <Typography
        variant="body"
        weight={active ? '600' : '500'}
        color={active ? colors['c-primary'] : colors['c-font']}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {item.name}
      </Typography>
      {active
        ? <Icon name="chevron-right" size={12} color={colors['c-primary']} />
        : null}
    </Button>
  )
}

/**
 * v2 排行榜 drawer 列表:沿用 v1 数据接口(setList / hideMenu),视觉改 v2 圆角卡片高亮。
 */
export default forwardRef<ListType, ListProps>(({ onBoundChange, onShowMenu }, ref) => {
  const [activeId, setActiveId] = useState('')
  const [longPressIndex, setLongPressIndex] = useState(-1)
  const [list, setList] = useState<BoardItem[]>([])

  useImperativeHandle(ref, () => ({
    setList(list, activeId) {
      setList(list)
      setActiveId(activeId)
    },
    hideMenu() { setLongPressIndex(-1) },
  }), [])

  const handlePress = (item: BoardItem) => {
    setActiveId(item.id)
    onBoundChange(item.id)
  }

  const handleLongPress = (item: BoardItem, index: number, btnRef: BtnType | null) => {
    btnRef?.measure?.((_fx, _fy, w, h, px, py) => {
      setLongPressIndex(index)
      onShowMenu({ listId: item.id, name: item.name, index }, {
        x: Math.ceil(px),
        y: Math.ceil(py),
        w: Math.ceil(w),
        h: Math.ceil(h),
      })
    })
  }

  return (
    <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="always">
      {list.map((item, index) => (
        <Row
          key={item.id}
          item={item}
          index={index}
          active={activeId === item.id}
          longPressed={longPressIndex === index}
          onPress={handlePress}
          onLongPress={handleLongPress}
        />
      ))}
    </ScrollView>
  )
})
