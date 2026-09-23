import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { View, ScrollView } from 'react-native'

import { createStyle } from '@/utils/tools'
import TagGroup, { type TagGroupProps } from './TagGroup'
import { useI18n } from '@/lang'
import { type TagInfo, type Source } from '@/store/songlist/state'
import { getTags, getTagType } from '@/core/songlist'
import Text from '@/components/common/Text'
// import { BorderWidths } from '@/theme'

export interface ListProps {
  onTagChange: TagGroupProps['onTagChange']
}

export interface ListType {
  loadTag: (source: Source, activeId: string, sortId: string) => void
}

export default forwardRef<ListType, ListProps>(({ onTagChange }, ref) => {
  // const theme = useTheme()
  const [activeId, setActiveId] = useState('')
  const [list, setList] = useState<TagInfo['tags']>([])
  const t = useI18n()
  // 已加载的分类体系(音源 + 排序对应的分类类型)
  const prevTagKey = useRef('')

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    loadTag(source, id, sortId) {
      if (id != activeId) setActiveId(id)
      const tagKey = `${source}__${getTagType(source, sortId)}`
      if (tagKey != prevTagKey.current) {
        setList([{ name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] }])
        void getTags(source, sortId).then(tagInfo => {
          if (isUnmountedRef.current) return
          prevTagKey.current = tagKey
          setList([
            { name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] },
            { name: t('songlist_tag_hot'), list: [...tagInfo.hotTag] },
            ...tagInfo.tags,
          ].filter(t => t.list.length))
        })
      }
    },
  }))


  return (
    <ScrollView style={{ flexShrink: 1, flexGrow: 0 }} keyboardShouldPersistTaps={'always'}>
      <View style={styles.tagContainer} onStartShouldSetResponder={() => true}>
        {
          list.map((type, index) => (
            <TagGroup
              key={index}
              name={type.name}
              list={type.list}
              activeId={activeId}
              onTagChange={onTagChange}
            />
          ))
        }
        {
          list.length == 1
            ? (
                <View style={styles.blankView}>
                  <Text>{t('list_loading')}</Text>
                </View>
              )
            : null
        }
      </View>
    </ScrollView>
  )
})


const styles = createStyle({
  tagContainer: {
    paddingTop: 15,
    paddingLeft: 15,
    paddingBottom: 15,
  },
  blankView: {
    paddingTop: '15%',
    paddingBottom: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
