// RN 自带的 SafeAreaView 拿不到 inset 数值,且内边距是在首次布局之后才异步补上的,
// 用在弹窗等临时出现的视图上会先跳一下(尺寸由内容决定时还会来回抖动)。
// 这里由页面级 SafeAreaView(PageContent)测出安全区后记录下来,弹窗打开时第一帧就能直接使用。

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export type SafeAreaInsetsHandler = (insets: SafeAreaInsets) => void

const isSameInsets = (a: SafeAreaInsets, b: SafeAreaInsets) => {
  return Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.right - b.right) < 0.5 &&
    Math.abs(a.bottom - b.bottom) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5
}

const isEmptyInsets = (insets: SafeAreaInsets) => {
  return insets.top < 0.5 && insets.right < 0.5 && insets.bottom < 0.5 && insets.left < 0.5
}

// 真的没有安全区时(如隐藏状态栏的无刘海 iPhone 竖屏)多久后按全 0 处理
const EMPTY_INSETS_FALLBACK_DELAY = 500

const initialInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }

export const safeAreaInsetsTools = {
  insets: initialInsets,
  /** 是否已由页面测量过(iOS 以外不会测量,始终为 false) */
  measured: false,
  emptyFallbackTimer: null as ReturnType<typeof setTimeout> | null,
  listeners: [] as SafeAreaInsetsHandler[],
  getInsets() {
    return this.insets
  },
  setInsets(insets: SafeAreaInsets) {
    // 每个页面的 SafeAreaView 刚挂载时会先报一次全 0,下一帧才补上内边距:把全 0 当作中间状态忽略,
    // 否则会覆盖掉已测好的数值,让播放条、弹窗跳一下。只在从未测到过时,兜底按全 0 处理
    if (isEmptyInsets(insets)) {
      if (!this.measured && !this.emptyFallbackTimer) {
        this.emptyFallbackTimer = setTimeout(() => {
          this.emptyFallbackTimer = null
          if (!this.measured) this.applyInsets(insets)
        }, EMPTY_INSETS_FALLBACK_DELAY)
      }
      return
    }
    if (this.emptyFallbackTimer) {
      clearTimeout(this.emptyFallbackTimer)
      this.emptyFallbackTimer = null
    }
    this.applyInsets(insets)
  },
  applyInsets(insets: SafeAreaInsets) {
    // 首次测量即使数值与初始值相同也要通知,让等待测量结果的视图显示出来
    if (this.measured && isSameInsets(this.insets, insets)) return
    this.measured = true
    this.insets = insets
    for (const handler of this.listeners) handler(insets)
  },
  onInsetsChanged(handler: SafeAreaInsetsHandler) {
    this.listeners.push(handler)
    return () => {
      this.listeners.splice(this.listeners.indexOf(handler), 1)
    }
  },
}
