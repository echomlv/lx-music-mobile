import { memo } from 'react'
import { ScrollView, View } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, exitApp as backHome } from '@/utils/tools'
import { exitApp, setNavActiveId } from '@/core/common'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'

import { Surface, Typography, V2Pressable } from '@/components/v2/atoms'

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuRow = memo(({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const { colors, tokens } = useDesignTokens()
  const activeId = useNavActiveId()
  const isActive = activeId == id

  const bg = isActive ? colors['c-primary-light-200-alpha-700'] : 'transparent'
  const iconColor = isActive ? colors['c-primary'] : colors['c-font-label']
  const textColor = isActive ? colors['c-primary'] : colors['c-font']

  return (
    <V2Pressable
      onPress={() => { onPress(id) }}
      disabled={isActive}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.md,
        borderRadius: tokens.radius.lg,
        backgroundColor: bg,
        marginBottom: tokens.spacing.xs,
      }}
    >
      <View style={{ width: 28, alignItems: 'center' }}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Typography
        variant="body"
        color={textColor}
        weight={isActive ? '600' : '400'}
        style={{ marginLeft: tokens.spacing.md }}
      >
        {t(id)}
      </Typography>
    </V2Pressable>
  )
})
MenuRow.displayName = 'v2.DrawerNav.MenuRow'

const HeaderCard = memo(() => {
  const { colors, tokens } = useDesignTokens()
  const statusBarHeight = useStatusbarHeight()

  return (
    <Surface
      variant="blur"
      radius="none"
      elevation="none"
      style={{
        paddingTop: statusBarHeight + tokens.spacing.xl,
        paddingBottom: tokens.spacing.xl,
        paddingHorizontal: tokens.spacing.lg,
        borderBottomLeftRadius: tokens.radius.xl,
        borderBottomRightRadius: tokens.radius.xl,
        overflow: 'hidden',
        marginBottom: tokens.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md }}>
        <Surface
          variant="solid"
          radius="lg"
          elevation="sm"
          backgroundColor={colors['c-primary-light-200-alpha-500']}
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="logo" color={colors['c-primary']} size={24} />
        </Surface>
        <View style={{ flex: 1 }}>
          <Typography variant="title" weight="700">LX Music</Typography>
          <Typography variant="caption" color={colors['c-font-label']}>
            洛雪音乐 · iOS
          </Typography>
        </View>
      </View>
    </Surface>
  )
})
HeaderCard.displayName = 'v2.DrawerNav.HeaderCard'

export const DrawerNavV2 = memo(() => {
  const { colors, tokens } = useDesignTokens()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

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

  return (
    <View style={{ flex: 1, backgroundColor: colors['c-content-background'] }}>
      <HeaderCard />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.md,
          paddingBottom: tokens.spacing.lg,
        }}
      >
        {NAV_MENUS.map(menu => (
          <MenuRow key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />
        ))}
      </ScrollView>

      {(showBackBtn || showExitBtn)
        ? (
            <View
              style={{
                paddingHorizontal: tokens.spacing.md,
                paddingTop: tokens.spacing.sm,
                paddingBottom: tokens.spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors['c-border-background'],
              }}
            >
              {showBackBtn ? <MenuRow id="back_home" icon="home" onPress={handlePress} /> : null}
              {showExitBtn ? <MenuRow id="nav_exit" icon="exit2" onPress={handlePress} /> : null}
            </View>
          )
        : null}
    </View>
  )
})

DrawerNavV2.displayName = 'v2.DrawerNav'
