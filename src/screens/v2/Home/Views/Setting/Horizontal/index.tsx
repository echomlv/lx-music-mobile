import { memo, useRef, useState } from 'react'
import { FlatList, ScrollView, View, type FlatListProps } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'
import { Surface, Typography, V2Pressable } from '@/components/v2/atoms'
import Main, { SETTING_SCREENS, type MainType, type SettingScreenIds } from '@/screens/Home/Views/Setting/Main'

type FlatListType = FlatListProps<SettingScreenIds>

const NavItem = memo(({ id, active, onPress }: {
  id: SettingScreenIds
  active: boolean
  onPress: (id: SettingScreenIds) => void
}) => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()

  return (
    <V2Pressable
      onPress={() => { onPress(id) }}
      disabled={active}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        backgroundColor: active ? colors['c-primary-light-200-alpha-700'] : 'transparent',
      }}
    >
      <Typography variant="body" weight={active ? '600' : '500'} color={active ? colors['c-primary'] : colors['c-font']} numberOfLines={1} style={{ flex: 1 }}>
        {t(`setting_${id}`)}
      </Typography>
      {active ? <Icon name="chevron-right" size={13} color={colors['c-primary']} /> : null}
    </V2Pressable>
  )
})
NavItem.displayName = 'v2.Home.Setting.Horizontal.NavItem'

const NavList = ({ onChangeId }: { onChangeId: (id: SettingScreenIds) => void }) => {
  const [activeId, setActiveId] = useState<SettingScreenIds>(global.lx.settingActiveId)
  const handlePress = (id: SettingScreenIds) => {
    global.lx.settingActiveId = id
    setActiveId(id)
    onChangeId(id)
  }
  const renderItem: FlatListType['renderItem'] = ({ item }) => <NavItem id={item} active={item == activeId} onPress={handlePress} />
  const keyExtractor: FlatListType['keyExtractor'] = item => item

  return (
    <FlatList
      data={SETTING_SCREENS}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ padding: 8, gap: 4 }}
      showsVerticalScrollIndicator={false}
    />
  )
}

const Horizontal = () => {
  const { colors, tokens } = useDesignTokens()
  const mainRef = useRef<MainType>(null)

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors['c-primary-light-300-alpha-200'] }}>
      <Surface
        variant="solid"
        radius="none"
        elevation="none"
        backgroundColor={colors['c-content-background']}
        style={{ width: 220, maxWidth: '30%', borderRightWidth: 1, borderRightColor: colors['c-border-background'] }}
      >
        <NavList onChangeId={id => { mainRef.current?.setActiveId(id) }} />
      </Surface>
      {/* 各分组(Section)自带卡片,这里不再额外包一层卡片,与竖屏保持一致 */}
      <ScrollView keyboardShouldPersistTaps="always" style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <Main ref={mainRef} />
      </ScrollView>
    </View>
  )
}

export default Horizontal
