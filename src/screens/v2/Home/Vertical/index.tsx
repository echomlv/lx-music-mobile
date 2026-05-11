import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'

/**
 * v2 竖屏 Home。PlayerBar 内部已自带 useModernUI 分支 → 自动渲染 PlayerBarV2。
 */
export default () => {
  return (
    <>
      <Content />
      <PlayerBar isHome />
    </>
  )
}
