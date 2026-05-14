import { memo } from 'react'
import { ScrollView, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { confirmDialog, exitApp as backHome } from '@/utils/tools'
import { exitApp, setNavActiveId } from '@/core/common'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'

import { Icon } from '@/components/common/Icon'
import { IconButton, Surface, V2Pressable } from '@/components/v2/atoms'

const ASIDE_WIDTH = 68
const ITEM_HIT = 44

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = memo(({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const { colors, tokens } = useDesignTokens()
  const activeId = useNavActiveId()
  const active = activeId === id

  return (
    <V2Pressable
      onPress={() => { onPress(id) }}
      style={{
        width: ITEM_HIT,
        height: ITEM_HIT,
        marginVertical: 4,
        borderRadius: tokens.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors['c-primary-light-200-alpha-700'] : 'transparent',
      }}
    >
      <Icon
        name={icon}
        size={20}
        color={active ? colors['c-primary'] : colors['c-font-label']}
      />
    </V2Pressable>
  )
})
MenuItem.displayName = 'v2.Horizontal.Aside.MenuItem'

const LogoHeader = () => {
  const { colors, tokens } = useDesignTokens()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View
      style={{
        paddingTop: statusBarHeight + tokens.spacing.sm,
        paddingBottom: tokens.spacing.sm,
        alignItems: 'center',
      }}
    >
      <Icon name="logo" size={22} color={colors['c-primary-dark-100-alpha-300']} />
    </View>
  )
}

const handlePress = (id: IdType) => {
  switch (id) {
    case 'nav_exit':
      void confirmDialog({
        message: global.i18n.t('exit_app_tip'),
        confirmButtonText: global.i18n.t('list_remove_tip_button'),
      }).then(isExit => {
        if (!isExit) return
        exitApp('Exit Btn')
      })
      return
    case 'back_home':
      backHome()
      return
  }
  global.app_event.changeMenuVisible(false)
  setNavActiveId(id)
}

const Aside = memo(() => {
  const { colors, tokens } = useDesignTokens()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  return (
    <Surface
      variant="solid"
      radius="none"
      elevation="none"
      backgroundColor={colors['c-content-background']}
      style={{
        width: ASIDE_WIDTH,
        borderRightWidth: 1,
        borderRightColor: colors['c-border-background'],
      }}
    >
      <LogoHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center', paddingVertical: tokens.spacing.xs }}
        showsVerticalScrollIndicator={false}
      >
        {NAV_MENUS.map(menu => (
          <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />
        ))}
      </ScrollView>
      <View style={{ alignItems: 'center', paddingBottom: tokens.spacing.sm }}>
        {showBackBtn
          ? (
              <IconButton
                name="home"
                size={20}
                hitSize={ITEM_HIT}
                radius="md"
                onPress={() => { handlePress('back_home') }}
                accessibilityLabel="back home"
              />
            )
          : null}
        {showExitBtn
          ? (
              <IconButton
                name="exit2"
                size={20}
                hitSize={ITEM_HIT}
                radius="md"
                onPress={() => { handlePress('nav_exit') }}
                accessibilityLabel="exit"
              />
            )
          : null}
      </View>
    </Surface>
  )
})

Aside.displayName = 'v2.Horizontal.Aside'

export default Aside
