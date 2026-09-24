import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    alignItems: 'flex-start',
  },
  // title: {

  // },
  label: {
    width: 50,
    textAlign: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    // 撑满容器宽度,让滑动条宽度由容器决定,不依赖原生 Slider 的测量结果(否则横屏弹窗里宽度会来回抖动)
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  sliderWrap: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
  },
})
