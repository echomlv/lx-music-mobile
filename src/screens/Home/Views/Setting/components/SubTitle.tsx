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
  const { colors, tokens } = useDesignTokens()

  if (useModernUI) {
    return (
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Typography
          variant="caption"
          weight="600"
          color={colors['c-font-label']}
          style={{ marginBottom: tokens.spacing.xs, letterSpacing: 0.5 }}
        >
          {title.toUpperCase()}
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
