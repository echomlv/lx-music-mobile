import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import VerticalV2 from '@/screens/v2/PlayDetail/Vertical'
import HorizontalV2 from '@/screens/v2/PlayDetail/Horizontal'
import BackgroundV2 from '@/screens/v2/PlayDetail/Background'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()
  const useModernUI = useSettingValue('theme.useModernUI')

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Body = useModernUI
    ? (isHorizontalMode ? HorizontalV2 : VerticalV2)
    : (isHorizontalMode ? Horizontal : Vertical)

  return (
    // 沉浸背景放在 PageContent 的背景层,铺满安全区,避免屏幕边缘露出白边
    <PageContent background={useModernUI ? <BackgroundV2 /> : undefined}>
      <StatusBar />
      <Body componentId={componentId} />
    </PageContent>
  )
}
