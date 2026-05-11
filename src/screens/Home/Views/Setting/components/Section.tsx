import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import { Surface, Typography } from '@/components/v2/atoms'
import Text from '@/components/common/Text'


interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

const SectionV1 = ({ title, children }: Props) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.title, borderLeftColor: theme['c-primary'] }} size={16}>{title}</Text>
      <View>{children}</View>
    </View>
  )
}

const SectionV2 = ({ title, children }: Props) => {
  const { colors, tokens } = useDesignTokens()

  return (
    <View style={{ marginBottom: tokens.spacing.lg }}>
      <Typography
        variant="caption"
        weight="600"
        color={colors['c-font-label']}
        style={{
          letterSpacing: 0.5,
          paddingHorizontal: tokens.spacing.md,
          marginBottom: tokens.spacing.xs,
        }}
      >
        {title.toUpperCase()}
      </Typography>
      <Surface
        variant="solid"
        radius="lg"
        elevation="sm"
        backgroundColor={colors['c-content-background']}
        style={{ marginHorizontal: 0 }}
      >
        <View style={{ paddingVertical: tokens.spacing.sm }}>{children}</View>
      </Surface>
    </View>
  )
}

export default (props: Props) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  return useModernUI ? <SectionV2 {...props} /> : <SectionV1 {...props} />
}


const styles = createStyle({
  container: {
    // paddingLeft: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  title: {
    borderLeftWidth: 5,
    paddingLeft: 12,
    marginBottom: 10,
  },
})
