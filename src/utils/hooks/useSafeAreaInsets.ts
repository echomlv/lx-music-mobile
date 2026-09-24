import { useEffect, useState } from 'react'
import { safeAreaInsetsTools } from '@/utils/safeAreaInsets'

export default () => {
  const [insets, setInsets] = useState(safeAreaInsetsTools.getInsets())

  useEffect(() => {
    // 挂载前可能已更新过
    setInsets(safeAreaInsetsTools.getInsets())
    return safeAreaInsetsTools.onInsetsChanged(setInsets)
  }, [])

  return insets
}
