import { memo } from 'react'
import { ScrollView, View } from 'react-native'
import { useDesignTokens } from '@/theme/v2'
import { useStatusbarHeight } from '@/store/common/hook'
import {
  AppBar,
  Card,
  IconButton,
  PillButton,
  Surface,
  Typography,
  isBlurAvailable,
} from '@/components/v2/atoms'
import { PlayerBarV2 } from './PlayerBarV2'

interface V2ShowcaseProps {
  onClose: () => void
}

/**
 * 开发态可视化预览 —— 将所有 v2 atoms 排到一个滚动页里,
 * 方便逐个对比设计令牌与新组件的视觉。
 *
 * 入口在「设置 → 主题 → 启用现代 UI」勾选后出现的预览按钮。
 */
export const V2Showcase = memo(({ onClose }: V2ShowcaseProps) => {
  const { colors, tokens } = useDesignTokens()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{ flex: 1, backgroundColor: colors['c-content-background'] }}>
      <AppBar
        title="v2 视觉预览"
        leading={
          <IconButton
            name="chevron-left"
            onPress={onClose}
            accessibilityLabel="关闭预览"
          />
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          paddingTop: tokens.spacing.lg,
          paddingBottom: tokens.spacing.xxxl + statusBarHeight,
          gap: tokens.spacing.xl,
        }}
      >
        <Section title="Surface · 三种 variant">
          <Surface variant="solid" radius="lg" elevation="sm" style={{ padding: tokens.spacing.lg }}>
            <Typography variant="body">solid · 实心容器 + 微阴影</Typography>
          </Surface>
          <Surface variant="blur" radius="lg" elevation="md" style={{ padding: tokens.spacing.lg }}>
            <Typography variant="body">
              blur · {isBlurAvailable() ? '原生毛玻璃' : '降级为半透明色块(BlurView 未安装或非 iOS)'}
            </Typography>
          </Surface>
          <Surface variant="glass" radius="lg" elevation="md" style={{ padding: tokens.spacing.lg }}>
            <Typography variant="body">glass · 毛玻璃 + 内描边</Typography>
          </Surface>
        </Section>

        <Section title="Card · 卡片 + 内边距">
          <Card>
            <Typography variant="subtitle">歌单标题</Typography>
            <View style={{ height: tokens.spacing.xs }} />
            <Typography variant="caption" color={colors['c-font-label']}>
              示例副标题 · 12 首
            </Typography>
          </Card>
          <Card variant="solid" elevation="md" padding="xxl">
            <Typography variant="title">大间距卡片</Typography>
          </Card>
        </Section>

        <Section title="Typography · 字号层级">
          <Typography variant="display">Display 显示</Typography>
          <Typography variant="title">Title 标题</Typography>
          <Typography variant="subtitle">Subtitle 副标题</Typography>
          <Typography variant="body">Body 正文文本</Typography>
          <Typography variant="label">Label 标签</Typography>
          <Typography variant="caption" color={colors['c-font-label']}>Caption 辅助说明</Typography>
          <Typography variant="title" emphasis>Emphasis 强调主色</Typography>
        </Section>

        <Section title="Pill 按钮">
          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
            <PillButton label="主操作" onPress={() => {}} />
            <PillButton label="次操作" variant="secondary" onPress={() => {}} />
            <PillButton label="幽灵" variant="ghost" onPress={() => {}} />
          </View>
          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.sm, flexWrap: 'wrap' }}>
            <PillButton label="Small" size="sm" onPress={() => {}} />
            <PillButton label="Medium" size="md" onPress={() => {}} />
            <PillButton label="Large" size="lg" onPress={() => {}} />
          </View>
          <View style={{ marginTop: tokens.spacing.sm }}>
            <PillButton label="占满宽度" fullWidth onPress={() => {}} />
          </View>
        </Section>

        <Section title="IconButton · 三种背景">
          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
            <IconButton name="play" background="none" />
            <IconButton name="play" background="subtle" />
            <IconButton name="play" background="primary" />
          </View>
        </Section>

        <Section title="Elevation · 阴影层级">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
            {(['none', 'sm', 'md', 'lg', 'xl'] as const).map(level => (
              <Surface
                key={level}
                variant="solid"
                elevation={level}
                radius="md"
                style={{
                  width: 84,
                  height: 84,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="label">{level}</Typography>
              </Surface>
            ))}
          </View>
        </Section>

        <Section title="Radius · 圆角档位">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
            {(['sm', 'md', 'lg', 'xl', 'pill'] as const).map(r => (
              <Surface
                key={r}
                variant="solid"
                elevation="sm"
                radius={r}
                style={{
                  width: 64,
                  height: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="label">{r}</Typography>
              </Surface>
            ))}
          </View>
        </Section>

        <Section title="PlayerBar v2 · 当前播放">
          <Typography variant="caption" color={colors['c-font-label']}>
            连接到当前播放状态。若无播放,标题会留空。
          </Typography>
          <View style={{ marginTop: tokens.spacing.sm }}>
            <PlayerBarV2 isHome={false} />
          </View>
        </Section>
      </ScrollView>
    </View>
  )
})

V2Showcase.displayName = 'v2.Showcase'

const Section = memo(({ title, children }: { title: string, children: React.ReactNode }) => {
  const { colors, tokens } = useDesignTokens()
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <Typography variant="label" color={colors['c-font-label']}>{title}</Typography>
      {children}
    </View>
  )
})

Section.displayName = 'v2.Showcase.Section'
