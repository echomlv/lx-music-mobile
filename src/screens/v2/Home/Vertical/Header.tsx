import { memo } from 'react'
import { View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'

import { IconButton, StatusBarV2, Surface, Typography } from '@/components/v2/atoms'
import SearchTypeSelectorV2 from '@/screens/v2/Home/Views/Search/SearchTypeSelector'

const headerRightSlots: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelectorV2 />,
}

const openMenu = () => {
  global.app_event.changeMenuVisible(true)
}

const Header = memo(() => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  const menuBtn = (
    <IconButton
      name="menu"
      size={18}
      hitSize={HEADER_HEIGHT}
      radius="md"
      onPress={openMenu}
      accessibilityLabel="menu"
    />
  )
  const title = (
    <View style={{ flex: 1, paddingHorizontal: tokens.spacing.sm }}>
      <Typography variant="subtitle" numberOfLines={1}>{t(id)}</Typography>
    </View>
  )
  const right = headerRightSlots[id] ?? null

  return (
    <>
      <StatusBarV2 />
      <Surface
        variant="solid"
        radius="none"
        elevation="none"
        backgroundColor={colors['c-content-background']}
        style={{ zIndex: 10 }}
      >
        <View
          style={{
            paddingTop: statusBarHeight,
            height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
            paddingHorizontal: tokens.spacing.xs,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {drawerLayoutPosition == 'left' ? menuBtn : null}
          {title}
          {right}
          {drawerLayoutPosition == 'left' ? null : menuBtn}
        </View>
      </Surface>
    </>
  )
})

Header.displayName = 'v2.Home.Header'

export default Header
