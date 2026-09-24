// import { useEffect, useState } from 'react'
import { Platform, SafeAreaView, StyleSheet, View, type LayoutChangeEvent, type LayoutRectangle } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { isHorizontalMode } from '@/utils/tools'
import { useCallback, useMemo, useRef } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { safeAreaInsetsTools } from '@/utils/safeAreaInsets'

interface Props {
  children: React.ReactNode
  /** 铺满整个屏幕(含安全区)的背景层,渲染在 SafeAreaView 之外 */
  background?: React.ReactNode
}

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(18), 10)

// iPhone 横屏时系统隐藏状态栏,SafeAreaView 顶部内边距为 0,内容会顶到屏幕上沿,补一点留白;
// iPad 横屏保留状态栏,不需要
const IPHONE_LANDSCAPE_TOP_GAP = 12

const ContentContainer = ({ children }: Props) => {
  const windowSize = useWindowSize()
  const outerSizeRef = useRef<LayoutRectangle | null>(null)
  const innerFrameRef = useRef<LayoutRectangle | null>(null)

  // 内层 View 在 SafeAreaView 中的位置即安全区内边距,记录下来供弹窗等不在页面 SafeAreaView 内的视图使用
  const updateInsets = useCallback(() => {
    const outer = outerSizeRef.current
    const inner = innerFrameRef.current
    if (!outer || !inner || !outer.width || !outer.height) return
    safeAreaInsetsTools.setInsets({
      top: inner.y,
      left: inner.x,
      right: Math.max(outer.width - inner.x - inner.width, 0),
      bottom: Math.max(outer.height - inner.y - inner.height, 0),
    })
  }, [])
  const handleOuterLayout = useCallback((event: LayoutChangeEvent) => {
    outerSizeRef.current = event.nativeEvent.layout
    updateInsets()
  }, [updateInsets])
  const handleInnerLayout = useCallback((event: LayoutChangeEvent) => {
    innerFrameRef.current = event.nativeEvent.layout
    updateInsets()
  }, [updateInsets])

  if (Platform.OS == 'ios') {
    const isIPhoneLandscape = !Platform.isPad && isHorizontalMode(windowSize.width, windowSize.height)
    return (
      <SafeAreaView style={{ flex: 1 }} onLayout={handleOuterLayout}>
        <View style={{ flex: 1, paddingTop: isIPhoneLandscape ? IPHONE_LANDSCAPE_TOP_GAP : 0 }} onLayout={handleInnerLayout}>
          {children}
        </View>
      </SafeAreaView>
    )
  }
  return <>{children}</>
}

export default ({ children, background }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()
  // const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  // useEffect(() => {
  //   const onChange = () => {
  //     setWH({ width: '100%', height: '100%' })
  //   }

  //   const changeEvent = Dimensions.addEventListener('change', onChange)
  //   return () => {
  //     changeEvent.remove()
  //   }
  // }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   // console.log('handleLayout', e.nativeEvent)
  //   // console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  // }
  // console.log('render page content')

  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ImageBackground
        style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
        source={theme['bg-image']}
        resizeMode="cover"
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme['c-main-background'],
          },
        ]}
      />
      {background}
      <ContentContainer>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {children}
        </View>
      </ContentContainer>
    </View>
  ), [children, background, theme, windowSize.height, windowSize.width])
  const picComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ImageBackground
          style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
          source={{ uri: pic!, headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme['c-content-background'],
              opacity: 0.76,
            },
          ]}
        />
        {background}
        <ContentContainer>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {children}
          </View>
        </ContentContainer>
      </View>
    )
  }, [children, background, pic, theme, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
