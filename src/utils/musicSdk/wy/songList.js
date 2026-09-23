// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_catlist.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_hot.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/top_playlist.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_detail.js

import { weapi, linuxapi } from './utils/crypto'
import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate, dateFormat, formatPlayCount } from '../../index'
import musicDetailApi from './musicDetail'
import { eapiRequest } from './utils/index'
import { formatSingerName } from '../utils'

export default {
  _requestObj_tags: null,
  _requestObj_hotTags: null,
  _requestObj_list: null,
  limit_list: 30,
  limit_song: 100000,
  successCode: 200,
  cookie: 'MUSIC_U=',
  _highQualityCursor: new Map(),
  sortList: [
    {
      name: '推荐',
      tid: 'recommend',
      id: 'recommend',
      disableTag: true,
    },
    {
      name: '官方',
      tid: 'official',
      id: 'official',
      disableTag: true,
    },
    {
      name: '精品',
      tid: 'highquality',
      id: 'highquality',
    },
    {
      name: '曲风',
      tid: 'style',
      id: 'style',
    },
    {
      name: '最热',
      tid: 'hot',
      id: 'hot',
    },
    // order=new 已失效(返回空列表)
    // {
    //   name: '最新',
    //   tid: 'new',
    //   id: 'new',
    // },
  ],
  regExps: {
    listDetailLink: /^.+(?:\?|&)id=(\d+)(?:&.*$|#.*$|$)/,
    listDetailLink2: /^.+\/playlist\/(\d+)\/\d+\/.+$/,
  },

  async handleParseId(link, retryNum = 0) {
    if (retryNum > 2) throw new Error('link try max num')

    const requestObj_listDetailLink = httpFetch(link)
    const { url, statusCode } = await requestObj_listDetailLink.promise
    // console.log(headers)
    if (statusCode > 400) return this.handleParseId(link, ++retryNum)
    return this.regExps.listDetailLink.test(url)
      ? url.replace(this.regExps.listDetailLink, '$1')
      : url.replace(this.regExps.listDetailLink2, '$1')
  },

  async getListId(id) {
    let cookie
    if (/###/.test(id)) {
      const [url, token] = id.split('###')
      id = url
      cookie = `MUSIC_U=${token}`
    }
    if ((/[?&:/]/.test(id))) {
      if (this.regExps.listDetailLink.test(id)) {
        id = id.replace(this.regExps.listDetailLink, '$1')
      } else if (this.regExps.listDetailLink2.test(id)) {
        id = id.replace(this.regExps.listDetailLink2, '$1')
      } else {
        id = await this.handleParseId(id)
      }
      // console.log(id)
    }
    return { id, cookie }
  },
  async getListDetail(rawId, page, tryNum = 0) { // 获取歌曲列表内的音乐
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    const { id, cookie } = await this.getListId(rawId)
    if (cookie) this.cookie = cookie

    const requestObj_listDetail = httpFetch('https://music.163.com/api/linux/forward', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        Cookie: this.cookie,
      },
      credentials: 'omit',
      cache: 'default',
      form: linuxapi({
        method: 'POST',
        url: 'https://music.163.com/api/v3/playlist/detail',
        params: {
          id,
          n: this.limit_song,
          s: 8,
        },
      }),
    })
    const { statusCode, body } = await requestObj_listDetail.promise
    if (statusCode !== 200 || body.code !== this.successCode) return this.getListDetail(id, page, ++tryNum)
    let limit = 1000
    let rangeStart = (page - 1) * limit
    // console.log(body)
    let list
    if (body.playlist.trackIds.length == body.privileges.length) {
      list = this.filterListDetail(body)
    } else {
      try {
        list = (await musicDetailApi.getList(body.playlist.trackIds.slice(rangeStart, limit * page).map(trackId => trackId.id))).list
      } catch (err) {
        console.log(err)
        if (err.message == 'try max num') {
          throw err
        } else {
          return this.getListDetail(id, page, ++tryNum)
        }
      }
    }
    // console.log(list)
    return {
      list,
      page,
      limit,
      total: body.playlist.trackIds.length,
      source: 'wy',
      info: {
        play_count: formatPlayCount(body.playlist.playCount),
        name: body.playlist.name,
        img: body.playlist.coverImgUrl,
        desc: body.playlist.description,
        author: body.playlist.creator.nickname,
      },
    }
  },
  filterListDetail({ playlist: { tracks }, privileges }) {
    // console.log(tracks, privileges)
    const list = []
    tracks.forEach((item, index) => {
      const types = []
      const _types = {}
      let size
      let privilege = privileges[index]
      if (privilege.id !== item.id) privilege = privileges.find(p => p.id === item.id)
      if (!privilege) return

      if (privilege.maxBrLevel == 'hires') {
        size = item.hr ? sizeFormate(item.hr.size) : null
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      switch (privilege.maxbr) {
        case 999000:
          size = null
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
        case 320000:
          size = item.h ? sizeFormate(item.h.size) : null
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
        case 192000:
        case 128000:
          size = item.l ? sizeFormate(item.l.size) : null
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
      }

      types.reverse()

      if (item.pc) {
        list.push({
          singer: item.pc.ar ?? '',
          name: item.pc.sn ?? '',
          albumName: item.pc.alb ?? '',
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl ?? '',
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      } else {
        list.push({
          singer: formatSingerName(item.ar, 'name'),
          name: item.name ?? '',
          albumName: item.al?.name,
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl,
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      }
    })
    return list
  },

  // 获取列表数据
  getList(sortId, tagId, page) {
    switch (sortId) {
      case 'recommend': return this.getRecommendList()
      // 官方歌单:歌单广场接口的「官方」分类(catalogue/hottags 中不提供),不与其他分类叠加
      case 'official': return this.getHotList('hot', '官方', page)
      case 'highquality': return this.getHighQualityList(tagId, page)
      case 'style': return this.getStyleList(tagId, page)
      default: return this.getHotList(sortId, tagId, page)
    }
  },
  // 推荐歌单:不支持分类与分页,一次取回
  getRecommendList(tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFetch('https://music.163.com/weapi/personalized/playlist', {
      method: 'post',
      form: weapi({
        limit: 100,
        total: true,
        n: 1000,
      }),
    })
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getRecommendList(++tryNum)
      const list = body.result.map(item => ({
        play_count: formatPlayCount(item.playCount),
        id: String(item.id),
        author: '',
        name: item.name,
        time: '',
        img: item.picUrl,
        total: item.trackCount,
        desc: item.copywriter,
        source: 'wy',
      }))
      return {
        list,
        total: list.length,
        page: 1,
        limit: list.length || this.limit_list,
        source: 'wy',
      }
    })
  },
  // 精品歌单:以上一页返回的 lasttime 作为下一页游标
  getHighQualityList(tagId, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    const cat = tagId || '全部'
    const lasttime = page == 1 ? 0 : this._highQualityCursor.get(`${cat}__${page}`)
    if (lasttime == null) return Promise.reject(new Error('highquality cursor not found'))
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFetch('https://music.163.com/weapi/playlist/highquality/list', {
      method: 'post',
      form: weapi({
        cat,
        limit: this.limit_list,
        lasttime,
        total: true,
      }),
    })
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getHighQualityList(tagId, page, ++tryNum)
      this._highQualityCursor.set(`${cat}__${page + 1}`, body.lasttime)
      return {
        list: this.filterList(body.playlists),
        total: parseInt(body.total),
        page,
        limit: this.limit_list,
        source: 'wy',
      }
    })
  },
  // 曲风歌单:tagId 为曲风 id,未选时默认「流行」
  getStyleList(tagId, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFetch('https://music.163.com/weapi/style-tag/home/playlist', {
      method: 'post',
      form: weapi({
        cursor: this.limit_list * (page - 1),
        size: this.limit_list,
        tagId: parseInt(tagId || '1000'),
        sort: 0,
      }),
    })
    return this._requestObj_list.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getStyleList(tagId, page, ++tryNum)
      return {
        list: body.data.playlist.map(item => ({
          play_count: formatPlayCount(item.playCount),
          id: String(item.id),
          author: item.userName,
          name: item.name,
          time: '',
          img: item.cover,
          total: item.songCount,
          desc: '',
          source: 'wy',
        })),
        total: body.data.page.total,
        page,
        limit: this.limit_list,
        source: 'wy',
      }
    })
  },
  getHotList(sortId, tagId, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFetch('https://music.163.com/weapi/playlist/list', {
      method: 'post',
      form: weapi({
        cat: tagId || '全部', // 全部,华语,欧美,日语,韩语,粤语,小语种,流行,摇滚,民谣,电子,舞曲,说唱,轻音乐,爵士,乡村,R&B/Soul,古典,民族,英伦,金属,朋克,蓝调,雷鬼,世界音乐,拉丁,另类/独立,New Age,古风,后摇,Bossa Nova,清晨,夜晚,学习,工作,午休,下午茶,地铁,驾车,运动,旅行,散步,酒吧,怀旧,清新,浪漫,性感,伤感,治愈,放松,孤独,感动,兴奋,快乐,安静,思念,影视原声,ACG,儿童,校园,游戏,70后,80后,90后,网络歌曲,KTV,经典,翻唱,吉他,钢琴,器乐,榜单,00后
        order: sortId, // hot,new
        limit: this.limit_list,
        offset: this.limit_list * (page - 1),
        total: true,
      }),
    })
    return this._requestObj_list.promise.then(({ body }) => {
      // console.log(body)
      if (body.code !== this.successCode) return this.getHotList(sortId, tagId, page, ++tryNum)
      return {
        list: this.filterList(body.playlists),
        total: parseInt(body.total),
        page,
        limit: this.limit_list,
        source: 'wy',
      }
    })
  },
  filterList(rawData) {
    // console.log(rawData)
    return rawData.map(item => ({
      play_count: formatPlayCount(item.playCount),
      id: String(item.id),
      author: item.creator.nickname,
      name: item.name,
      time: item.createTime ? dateFormat(item.createTime, 'Y-M-D') : '',
      img: item.coverImgUrl,
      grade: item.grade,
      total: item.trackCount,
      desc: item.description,
      source: 'wy',
    }))
  },

  // 获取标签
  getTag(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch('https://music.163.com/weapi/playlist/catalogue', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestObj_tags.promise.then(({ body }) => {
      // console.log(JSON.stringify(body))
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterTagInfo(body)
    })
  },
  filterTagInfo({ sub, categories }) {
    const subList = {}
    for (const item of sub) {
      if (!subList[item.category]) subList[item.category] = []
      subList[item.category].push({
        parent_id: categories[item.category],
        parent_name: categories[item.category],
        id: item.name,
        name: item.name,
        source: 'wy',
      })
    }

    const list = []
    for (const key of Object.keys(categories)) {
      list.push({
        name: categories[key],
        list: subList[key],
        source: 'wy',
      })
    }
    return list
  },

  // 获取热门标签
  getHotTag(tryNum = 0) {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_hotTags = httpFetch('https://music.163.com/weapi/playlist/hottags', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestObj_hotTags.promise.then(({ body }) => {
      // console.log(JSON.stringify(body))
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterHotTagInfo(body.tags)
    })
  },
  filterHotTagInfo(rawList) {
    return rawList.map(item => ({
      id: item.playlistTag.name,
      name: item.playlistTag.name,
      source: 'wy',
    }))
  },

  // 曲风标签:顶层曲风作为热门,每个顶层曲风与其全部子孙曲风组成一个分组
  getStyleTags(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch('https://music.163.com/weapi/tag/list/get', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getStyleTags(++tryNum)
      const toTag = (item, parent) => ({
        parent_id: String(parent.tagId),
        parent_name: parent.tagName,
        id: String(item.tagId),
        name: item.tagName,
        source: 'wy',
      })
      const flatten = item => [item, ...(item.childrenTags ?? []).flatMap(flatten)]
      return {
        tags: body.data.map(parent => ({
          name: parent.tagName,
          list: flatten(parent).map(item => toTag(item, parent)),
          source: 'wy',
        })),
        hotTag: body.data.map(parent => toTag(parent, parent)),
        source: 'wy',
      }
    })
  },
  // 不同排序使用的分类体系:曲风使用独立的曲风标签
  getTagType(sortId) {
    return sortId == 'style' ? 'style' : ''
  },
  getTags(sortId) {
    if (this.getTagType(sortId) == 'style') return this.getStyleTags()
    return Promise.all([this.getTag(), this.getHotTag()]).then(([tags, hotTag]) => ({ tags, hotTag, source: 'wy' }))
  },

  async getDetailPageUrl(rawId) {
    const { id } = await this.getListId(rawId)
    return `https://music.163.com/#/playlist?id=${id}`
  },

  search(text, page, limit = 20) {
    return eapiRequest('/api/cloudsearch/pc', {
      s: text,
      type: 1000, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
      limit,
      total: page == 1,
      offset: limit * (page - 1),
    })
      .promise.then(({ body }) => {
        if (body.code != this.successCode) throw new Error('filed')
        // console.log(body)
        return {
          list: this.filterList(body.result.playlists),
          limit,
          total: body.result.playlistCount,
          source: 'wy',
        }
      })
  },
}

// getList
// getTags
// getListDetail
