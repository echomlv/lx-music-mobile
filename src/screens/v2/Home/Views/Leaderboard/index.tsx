import { useHorizontalMode } from '@/utils/hooks'
import Horizontal from './Horizontal'
import Vertical from './Vertical'

/**
 * v2 排行榜:竖屏与横屏均使用现代榜单导航,歌曲列表沿用统一 v2 行样式。
 */
export default () => {
  const isHorizontalMode = useHorizontalMode()
  return isHorizontalMode ? <Horizontal /> : <Vertical />
}
