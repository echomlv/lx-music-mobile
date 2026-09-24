import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'
import { BorderWidths } from '@/theme'
import ButtonBar from './ActionBar'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useDesignTokens } from '@/theme/v2'
import Text, { AnimatedText } from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useAnimateOnecNumber } from '@/utils/hooks/useAnimateNumber'
import { useStatusbarHeight } from '@/store/common/hook'
import { Surface, Typography } from '@/components/v2/atoms'

const IMAGE_WIDTH = scaleSizeW(70)

const CountText = memo(({ count }: { count: string }) => {
  const [animFade] = useAnimateOnecNumber(0, 1, 250, false)
  const [animTranslateY] = useAnimateOnecNumber(10, 0, 250, false)
  return (
    <AnimatedText style={{
      ...styles.playCount,
      opacity: animFade,
      transform: [
        { translateY: animTranslateY },
      ],
    }} numberOfLines={ 1 }>{count}</AnimatedText>
  )
}, (prevProps, nextProps) => {
  return true
})

const Pic = ({ componentId, playCount, imgUrl }: {
  componentId: string
  playCount: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <View style={{ ...styles.listItemImg, width: IMAGE_WIDTH, height: IMAGE_WIDTH }}>
      <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`} url={pic} style={{ flex: 1, borderRadius: 4 }} />
      {
        playCount && animated ? <CountText count={playCount} /> : null
      }
    </View>
  )
}

export interface HeaderProps {
  componentId: string
  /** 横屏侧栏布局:纵向排列,放在左侧固定栏中 */
  side?: boolean
  /** 初始信息;横竖屏切换时 Header 会重新挂载,用它恢复已加载的歌单信息 */
  initInfo?: DetailInfo
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

const COVER_V2 = scaleSizeW(110)
const COVER_SIDE = 88
// 侧栏内容宽度达到这个值(iPad)时,改为大封面在上、信息在下的布局
const SIDE_LARGE_MIN_WIDTH = 280
const COVER_SIDE_LARGE_MAX = 320

const HeaderV1 = forwardRef<HeaderType, HeaderProps>(({ componentId, initInfo }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>(initInfo ?? { name: '', desc: '', playCount: '', imgUrl: info.img })

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  return (
    <View style={{ ...styles.container, paddingTop: statusBarHeight, borderBottomColor: theme['c-border-background'] }}>
      <View style={{ flexDirection: 'row', flexGrow: 0, flexShrink: 0, padding: 10 }}>
        <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
        <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingLeft: 5 }} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={14} numberOfLines={ 1 }>{detailInfo.name}</Text>
          <View style={{ flexGrow: 0, flexShrink: 1 }}>
            <Text size={13} color={theme['c-font-label']} numberOfLines={ 4 }>{detailInfo.desc}</Text>
          </View>
        </View>
      </View>
      <ButtonBar />
    </View>
  )
})

const PicV2 = ({ componentId, imgUrl, size = COVER_V2 }: {
  componentId: string
  imgUrl?: string
  size?: number
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <Surface
      variant="solid"
      radius="lg"
      elevation="sm"
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      <Image
        nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`}
        url={pic}
        style={{ width: size, height: size }}
      />
    </Surface>
  )
}

const HeaderV2 = forwardRef<HeaderType, HeaderProps>(({ componentId, side = false, initInfo }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const { colors, tokens } = useDesignTokens()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>(initInfo ?? { name: '', desc: '', playCount: '', imgUrl: info.img })
  const [sideContentWidth, setSideContentWidth] = useState(0)

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  if (side) {
    const isLarge = sideContentWidth >= SIDE_LARGE_MIN_WIDTH
    const titleInfo = (
      <View style={isLarge ? null : { flex: 1 }} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
        <Typography variant="subtitle" weight="700" numberOfLines={3}>
          {detailInfo.name}
        </Typography>
        {detailInfo.playCount
          ? (
              <Typography variant="caption" color={colors['c-font-label']} numberOfLines={1} style={{ marginTop: tokens.spacing.xs }}>
                {detailInfo.playCount}
              </Typography>
            )
          : null}
      </View>
    )
    return (
      <View style={{
        paddingTop: statusBarHeight + tokens.spacing.lg,
        paddingHorizontal: tokens.spacing.lg,
        paddingBottom: tokens.spacing.lg,
        gap: tokens.spacing.md,
      }}>
        <View
          onLayout={e => { setSideContentWidth(e.nativeEvent.layout.width) }}
          style={isLarge
            ? { gap: tokens.spacing.md }
            : { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.md }}
        >
          <PicV2
            componentId={componentId}
            imgUrl={detailInfo.imgUrl}
            size={isLarge ? Math.min(sideContentWidth, COVER_SIDE_LARGE_MAX) : COVER_SIDE}
          />
          {titleInfo}
        </View>
        {detailInfo.desc
          ? (
              <Typography variant="caption" color={colors['c-font-label']} numberOfLines={4}>
                {detailInfo.desc}
              </Typography>
            )
          : null}
        <ButtonBar compact />
      </View>
    )
  }

  return (
    <Surface
      variant="blur"
      radius="none"
      elevation="sm"
      style={{
        paddingTop: statusBarHeight + tokens.spacing.md,
        paddingBottom: tokens.spacing.md,
        backgroundColor: colors['c-content-background'],
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: tokens.spacing.lg,
        gap: tokens.spacing.md,
      }}>
        <PicV2 componentId={componentId} imgUrl={detailInfo.imgUrl} />
        <View style={{ flex: 1, paddingTop: tokens.spacing.xs }} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Typography variant="title" weight="700" numberOfLines={2}>
            {detailInfo.name}
          </Typography>
          {detailInfo.playCount
            ? (
                <Typography
                  variant="caption"
                  color={colors['c-font-label']}
                  numberOfLines={1}
                  style={{ marginTop: tokens.spacing.xs }}
                >
                  {detailInfo.playCount}
                </Typography>
              )
            : null}
          {detailInfo.desc
            ? (
                <Typography
                  variant="caption"
                  color={colors['c-font-label']}
                  numberOfLines={3}
                  style={{ marginTop: tokens.spacing.xs }}
                >
                  {detailInfo.desc}
                </Typography>
              )
            : null}
        </View>
      </View>
      <View style={{ marginTop: tokens.spacing.md }}>
        <ButtonBar />
      </View>
    </Surface>
  )
})
HeaderV2.displayName = 'v2.SonglistDetail.Header'

export default forwardRef<HeaderType, HeaderProps>((props, ref) => {
  const useModernUI = useSettingValue('theme.useModernUI')
  return useModernUI ? <HeaderV2 {...props} ref={ref} /> : <HeaderV1 {...props} ref={ref} />
})

const styles = createStyle({
  container: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    borderBottomWidth: BorderWidths.normal,
  },
  listItemImg: {
    // backgroundColor: '#eee',
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
    // width: 70,
    // height: 70,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: {
    //       width: 0,
    //       height: 1,
    //     },
    //     shadowOpacity: 0.20,
    //     shadowRadius: 1.41,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  playCount: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    fontSize: 12,
    paddingLeft: 3,
    paddingRight: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
})
