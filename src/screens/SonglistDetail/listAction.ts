import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${id}`
const getCollectListId = (id: string, source: LX.OnlineSource) => `${source}_${toMD5(getListId(id, source))}`

const isUserList = (list: LX.List.MyListInfo): list is LX.List.UserListInfo => list.id != LIST_IDS.DEFAULT && list.id != LIST_IDS.LOVE

/**
 * 查找已收藏的歌单
 * 收藏时 sourceListId 存的是原始 id(syncSourceList 依赖它拉取歌单),同时兼容以 `${source}__${id}` 存储的数据
 */
export const findCollectedList = (lists: readonly LX.List.MyListInfo[], id: string, source: LX.OnlineSource) => {
  const collectListId = getCollectListId(id, source)
  const listId = getListId(id, source)
  return lists.filter(isUserList).find(l => {
    if (l.id == collectListId) return true
    return l.source == source && (l.sourceListId == id || l.sourceListId == listId)
  })
}

export const handlePlay = async(id: string, source: Source, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  const listId = getListId(id, source)
  let isPlayingList = false
  // console.log(list)
  if (!list?.length) list = (await getListDetail(id, source, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(source, id)
  if (!fullList.length) return
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(id: string, source: Source, name: string) => {
  const targetList = findCollectedList(listState.userList, id, source)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(source, id)
  await createList({
    name,
    id: getCollectListId(id, source),
    list,
    source,
    sourceListId: id,
  })
  toast(global.i18n.t('collect_success'))
}
