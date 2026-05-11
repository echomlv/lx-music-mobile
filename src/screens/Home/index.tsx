import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import HomeV2 from '@/screens/v2/Home'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  const useModernUI = useSettingValue('theme.useModernUI')
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      {
        useModernUI
          ? <HomeV2 />
          : isHorizontalMode
            ? <Horizontal />
            : <Vertical />
      }
    </PageContent>
  )
}
