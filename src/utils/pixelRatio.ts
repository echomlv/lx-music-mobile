/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { PixelRatio, Platform } from 'react-native'
import { windowSizeTools } from './windowSizeTools'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

// 获取屏幕的dp
const size = windowSizeTools.getSize()
// console.log('size', size)
let screenW = size.width
let screenH = size.height
if (screenW > screenH) {
  const temp = screenW
  screenW = screenH
  screenH = temp
}
let fontScale = PixelRatio.getFontScale()
let pixelRatio = PixelRatio.get()
// 根据dp获取屏幕的px
let screenPxW = PixelRatio.getPixelSizeForLayoutSize(screenW)
let screenPxH = PixelRatio.getPixelSizeForLayoutSize(screenH)
// console.log(screenPxW, screenPxH)

// iPad 屏幕短边按 iPhone 6 基准换算后 scale 会顶到 3.1,UI 显得过大;
// 改用更克制的上限,让平板视觉接近"略放大的 iPhone"而非充满屏幕的巨型控件。
const isPad = Platform.OS == 'ios' && Platform.isPad
const SCALE_CAP = isPad ? 2.4 : 3.1
const scaleW = screenPxW / designWidth
const scaleH = screenPxH / designHeight
const scale = Math.min(scaleW, scaleH, SCALE_CAP)
// console.log(scale)

/**
 * 设置text
 * @param size  px
 * @returns dp
 */
export function getTextSize(size: number) {
  // console.log('screenW======' + screenW)
  // console.log('screenPxW======' + screenPxW)
  let scaleWidth = screenW / designWidth
  let scaleHeight = screenH / designHeight
  // console.log(scaleWidth, scaleHeight)
  let scale = Math.min(scaleWidth, scaleHeight, 1.3)
  size = Math.floor(size * scale / fontScale)
  // console.log(size)
  return size
}
export function setSpText(size: number) {
  return getTextSize(size) * global.lx.fontSize
}

/**
 * 设置高度
 * @param size  px
 * @returns dp
 */
export function scaleSizeH(size: number) {
  // console.log(screenPxH / designHeight)
  // let scaleHeight = size * Math.min(screenPxH / designHeight, 3.1)
  let scaleHeight = size * scale
  size = Math.floor(scaleHeight / pixelRatio)
  return size * global.lx.fontSize
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  // console.log(screenPxW / designWidth)
  // let scaleWidth = size * Math.min(screenPxW / designWidth, 3.1)
  let scaleWidth = size * scale
  size = Math.floor(scaleWidth / pixelRatio)
  return size * global.lx.fontSize
}


export const scaleSizeWR = (size: number) => {
  return size * 2 - scaleSizeW(size)
}

export const scaleSizeHR = (size: number) => {
  return size * 2 - scaleSizeH(size)
}

export const scaleSizeAbsHR = (size: number) => {
  let scaleHeight = size * scale
  return size * 2 - Math.floor(scaleHeight / pixelRatio)
}
