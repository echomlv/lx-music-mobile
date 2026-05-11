import { useHorizontalMode } from '@/utils/hooks'
import Horizontal from '@/screens/Home/Views/Leaderboard/Horizontal'
import Vertical from './Vertical'

/**
 * v2 排行榜:竖屏走 v2,横屏暂时复用 v1(后续横屏切片再统一)。
 */
export default () => {
  const isHorizontalMode = useHorizontalMode()
  return isHorizontalMode ? <Horizontal /> : <Vertical />
}
