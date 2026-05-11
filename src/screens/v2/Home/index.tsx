import { useHorizontalMode } from '@/utils/hooks'
import Vertical from './Vertical'
import Horizontal from './Horizontal'

/**
 * v2 Home 主屏入口。横竖屏分支同 v1,内部组件全部走 v2 atoms / organisms。
 * 由 settings['theme.useModernUI'] 控制是否启用,父级在 src/screens/Home/index.tsx 分支。
 */
export default () => {
  const isHorizontalMode = useHorizontalMode()
  return isHorizontalMode ? <Horizontal /> : <Vertical />
}
