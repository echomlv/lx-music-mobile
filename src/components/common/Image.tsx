import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { createStyle } from '@/utils/tools'
import { type ComponentProps, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, type ViewProps, StyleSheet, Image as FastImage } from 'react-native'
// import FastImage, { type FastImageProps } from 'react-native-fast-image'
import Text from './Text'
import { useLayout } from '@/utils/hooks'
// export type { OnLoadEvent } from 'react-native-fast-image'

export interface ImageProps extends ViewProps {
  style: ComponentProps<typeof FastImage>['style']
  url?: string | number | null
  cache?: boolean
  resizeMode?: ComponentProps<typeof FastImage>['resizeMode']
  onError?: (url: string | number) => void
  /** 加载失败后的重试次数,全部失败才显示默认图并触发 onError */
  retryCount?: number
}

const RETRY_BASE_DELAY = 1000
// 播放器封面(播放栏/播放详情)的重试次数
export const PLAYER_PIC_RETRY_COUNT = 2


export const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const encodeUriSafe = (uri: string) => {
  try {
    return encodeURI(decodeURI(uri))
  } catch {
    return encodeURI(uri)
  }
}

const normalizeUri = (url?: string | number | null) => {
  if (typeof url != 'string') return url
  if (!url) return url
  if (url.startsWith('/')) return 'file://' + url

  let uri = url.trim()

  if (uri.startsWith('//')) uri = 'https:' + uri
  if (uri.includes('{size}')) uri = uri.replace(/\{size\}/g, '400')

  return encodeUriSafe(uri)
}

const EmptyPic = memo(({ style, nativeID }: { style: ImageProps['style'], nativeID: ImageProps['nativeID'] }) => {
  const theme = useTheme()
  const { onLayout, width } = useLayout()
  const size = width * 0.36

  return (
    <View style={StyleSheet.compose({ ...styles.emptyPic, backgroundColor: theme['c-primary-light-900-alpha-200'], gap: size * 0.1 }, style)} onLayout={onLayout} nativeID={nativeID}>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']}>L</Text>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']} style={styles.text}>X</Text>
    </View>
  )
})

const Image = memo(({ url, cache, resizeMode = 'cover', style, onError, nativeID, retryCount = 0 }: ImageProps) => {
  const [isError, setError] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearRetryTimer = () => {
    if (!retryTimer.current) return
    clearTimeout(retryTimer.current)
    retryTimer.current = null
  }
  const handleError = useCallback(() => {
    if (retryAttempt < retryCount) {
      clearRetryTimer()
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null
        setRetryAttempt(retryAttempt + 1)
      }, RETRY_BASE_DELAY * 2 ** retryAttempt)
      return
    }
    setError(true)
    onError?.(url!)
  }, [onError, url, retryAttempt, retryCount])
  useEffect(() => {
    setError(false)
    setRetryAttempt(0)
    return clearRetryTimer
  }, [url])
  let uri = typeof url == 'number'
    ? FastImage.resolveAssetSource(url).uri
    : normalizeUri(url) as string | undefined
  const showDefault = useMemo(() => !uri || isError, [isError, uri])
  return (
    showDefault ? <EmptyPic style={style} nativeID={nativeID} />
      : (
          <FastImage
            // 换 key 重新挂载,触发重新请求
            key={retryAttempt}
            style={style}
            source={{
              uri: uri!,
              headers: defaultHeaders,
              cache: cache === false ? 'reload' : 'force-cache',
              // priority: FastImage.priority.normal,
              // cache: cache === false ? 'web' : 'immutable',
            }}
            onError={handleError}
            resizeMode={resizeMode}
            nativeID={nativeID}
          />
        )
  )
}, (prevProps, nextProps) => {
  return prevProps.url == nextProps.url &&
    prevProps.style == nextProps.style &&
    prevProps.retryCount == nextProps.retryCount &&
    prevProps.nativeID == nextProps.nativeID
})

export const getSize = (uri: string, success: (width: number, height: number) => void, failure?: (error: any) => void) => {
  FastImage.getSize(normalizeUri(uri) as string, success, failure)
}
export const clearMemoryCache = async() => {
  // return Promise.all([FastImage.clearMemoryCache(), FastImage.clearDiskCache()])
}
export default Image

const styles = createStyle({
  emptyPic: {
    borderRadius: BorderRadius.normal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingLeft: 2,
  },
})
