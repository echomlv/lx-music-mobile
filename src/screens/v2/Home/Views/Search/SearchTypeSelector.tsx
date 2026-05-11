import { memo, useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'

import { useDesignTokens } from '@/theme/v2'
import { useI18n } from '@/lang'
import { type SearchType } from '@/store/search/state'
import { getSearchSetting } from '@/utils/data'

import { Typography, V2Pressable } from '@/components/v2/atoms'

const SEARCH_TYPE_LIST = ['music', 'songlist'] as const

/**
 * v2 搜索类型切换器(挂在 Header 右侧)。
 * 改为 pill chip 风格,无下划线。
 */
export default memo(() => {
  const { colors, tokens } = useDesignTokens()
  const t = useI18n()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => { setType(info.type) })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(t2 => ({ label: t(`search_type_${t2}`), id: t2 }))
  }, [t])

  const handleTypeChange = (id: SearchType) => {
    setType(id)
    global.app_event.searchTypeChanged(id)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{
        alignItems: 'center',
        gap: tokens.spacing.xs,
        paddingHorizontal: tokens.spacing.xs,
      }}
      style={{ flexGrow: 0, flexShrink: 1 }}
    >
      {list.map(item => {
        const active = item.id === type
        return (
          <V2Pressable
            key={item.id}
            onPress={() => { handleTypeChange(item.id) }}
            style={{
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.xs,
              borderRadius: tokens.radius.pill,
              backgroundColor: active ? colors['c-primary-light-200-alpha-700'] : 'transparent',
            }}
          >
            <Typography
              variant="label"
              weight={active ? '600' : '500'}
              color={active ? colors['c-primary'] : colors['c-font-label']}
            >
              {item.label}
            </Typography>
          </V2Pressable>
        )
      })}
    </ScrollView>
  )
})
