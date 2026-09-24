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

const initialInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }

export const safeAreaInsetsTools = {
  insets: initialInsets,
  listeners: [] as SafeAreaInsetsHandler[],
  getInsets() {
    return this.insets
  },
  setInsets(insets: SafeAreaInsets) {
    if (isSameInsets(this.insets, insets)) return
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
