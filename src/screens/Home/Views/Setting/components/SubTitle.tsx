import { memo } from 'react'

import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import { Typography } from '@/components/v2/atoms'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  const { tokens } = useDesignTokens()

  if (useModernUI) {
    // 与 SettingRow 同样的水平内边距和标题字号,让子标题类设置项与开关行对齐
    return (
      <View style={{ paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm }}>
        <Typography variant="body" weight="500" style={{ marginBottom: tokens.spacing.sm }}>
          {title}
        </Typography>
        {children}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  )
})


const styles = createStyle({
  container: {
    paddingLeft: 25,
    marginBottom: 18,
  },
  title: {
    marginLeft: -10,
    marginBottom: 10,
    // lineHeight: 16,
  },
})
