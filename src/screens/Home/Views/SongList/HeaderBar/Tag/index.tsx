import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// import TagPopup, { type TagPopupProps, type TagPopupType } from './TagPopup'
import CurrentTagBtn, { type CurrentTagBtnType } from './CurrentTagBtn'
import { type Source } from '@/store/songlist/state'
import { isTagDisabled } from '@/core/songlist'


export interface TagProps {
  onTagChange: (name: string, id: string) => void
}

export interface TagType {
  setSelectedTagInfo: (source: Source, name: string, activeId: string, sortId: string) => void
  /** 切换排序;resetTag 为 true 时(分类体系改变)重置为默认分类 */
  setSortId: (sortId: string, resetTag: boolean) => void
}

export default forwardRef<TagType, TagProps>(({ onTagChange }, ref) => {
  // console.log('render tag btn')
  const currentTagBtnRef = useRef<CurrentTagBtnType>(null)
  // const tagPopupRef = useRef<TagPopupType>(null)
  const tagInfoRef = useRef<{ source: Source, activeId: string, sortId: string }>({ source: 'kw', activeId: '', sortId: '' })

  useEffect(() => {
    const handleChange = (name: string, id: string) => {
      onTagChange(name, id)
      tagInfoRef.current.activeId = id
      currentTagBtnRef.current?.setCurrentTagInfo(name)
    }

    global.app_event.on('songlistTagInfoChange', handleChange)
    return () => {
      global.app_event.off('songlistTagInfoChange', handleChange)
    }
  }, [onTagChange])

  useImperativeHandle(ref, () => ({
    setSelectedTagInfo(source, name, activeId, sortId) {
      tagInfoRef.current.activeId = activeId
      tagInfoRef.current.source = source
      tagInfoRef.current.sortId = sortId
      currentTagBtnRef.current?.setCurrentTagInfo(name)
      currentTagBtnRef.current?.setDisabled(isTagDisabled(source, sortId))
    },
    setSortId(sortId, resetTag) {
      tagInfoRef.current.sortId = sortId
      currentTagBtnRef.current?.setDisabled(isTagDisabled(tagInfoRef.current.source, sortId))
      if (!resetTag) return
      tagInfoRef.current.activeId = ''
      currentTagBtnRef.current?.setCurrentTagInfo('')
    },
  }))

  const handleShowList = () => {
    global.app_event.showSonglistTagList(tagInfoRef.current.source, tagInfoRef.current.activeId, tagInfoRef.current.sortId)
  }

  // const handleChangeTag: TagProps['onTagChange'] = (name, id) => {
  //   tagInfoRef.current.activeId = id
  //   onTagChange(name, id)
  //   currentTagBtnRef.current?.setCurrentTagInfo(name)
  // }

  return <CurrentTagBtn ref={currentTagBtnRef} onShowList={handleShowList} />
})
