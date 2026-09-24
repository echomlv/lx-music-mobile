import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { View, TouchableOpacity, SafeAreaView, type ViewStyle } from 'react-native'

import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'
import { SheetSurface } from '@/components/v2/molecules'

const styles = createStyle({
  shrink: {
    flexShrink: 1,
  },
  centeredView: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center',
  },
  modalView: {
    elevation: 6,
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flex: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    paddingLeft: 10,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
    // lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    // borderTopRightRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#eee',
  },
})

// 面板贴边的一侧为直角,朝向屏幕内侧的两角为圆角
const SHEET_RADIUS = 8
const getSheetRadius = (position: NonNullable<PopupProps['position']>): ViewStyle => {
  const r = SHEET_RADIUS
  switch (position) {
    case 'top': return { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: r, borderBottomRightRadius: r }
    case 'left': return { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: r, borderBottomRightRadius: r }
    case 'right': return { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: r, borderBottomLeftRadius: r }
    case 'bottom':
    default: return { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: r, borderTopRightRadius: r }
  }
}

export interface PopupProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom'
  title?: string
  children: React.ReactNode
}

export interface PopupType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<PopupType, PopupProps>(({
  onHide = () => {},
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  position = 'bottom',
  title = '',
  children,
}: PopupProps, ref) => {
  const theme = useTheme()
  const useModernUI = useSettingValue('theme.useModernUI')
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const statusBarHeight = useStatusbarHeight()

  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => closeBtn
    ? <TouchableOpacity style={styles.closeBtn} onPress={() => modalRef.current?.setVisible(false)}>
        <Icon name="close" style={{ color: theme['c-font-label'] }} size={12} />
      </TouchableOpacity>
    : null, [closeBtn, theme])

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    switch (position) {
      case 'top':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-start',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
          },
        ] as const
      case 'left':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'right':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'bottom':
      default:
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-end',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
          },
        ] as const
    }
  }, [position, statusBarHeight])
  const sheetRadius = useMemo(() => getSheetRadius(position), [position])

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.2)" ref={modalRef}>
      <View style={{ ...styles.centeredView, ...centeredViewStyle, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, ...modalViewStyle, ...sheetRadius, overflow: 'hidden', backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
          {/* Modal 内容不受页面 SafeAreaView 约束:面板背景铺满到屏幕边缘,内容让出刘海/状态栏/Home 条 */}
          <SafeAreaView style={styles.shrink}>
            {useModernUI
              ? (
                  <SheetSurface
                    title={title ?? undefined}
                    onClose={closeBtn ? () => { modalRef.current?.setVisible(false) } : undefined}
                    showHandle={position == 'bottom' || position == 'top'}
                    // 允许收缩,使内部 ScrollView 限制在安全区留白之内,滚动到底时内容不会被 Home 条遮住
                    style={[sheetRadius, styles.shrink]}
                    contentStyle={styles.shrink}
                  >
                    {children}
                  </SheetSurface>
                )
              : (
                  <>
                    <View style={styles.header}>
                      <Text size={13} style={styles.title} numberOfLines={1}>{title}</Text>
                      {closeBtnComponent}
                    </View>
                    {children}
                  </>
                )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  )
})
