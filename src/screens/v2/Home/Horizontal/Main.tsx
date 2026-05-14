import { useEffect, useMemo, useState } from 'react'

import Search from '@/screens/v2/Home/Views/Search'
import SongList from '@/screens/v2/Home/Views/SongList'
import Mylist from '@/screens/v2/Home/Views/Mylist'
import Leaderboard from '@/screens/v2/Home/Views/Leaderboard'
import Setting from '@/screens/v2/Home/Views/Setting'
import commonState, { type InitState as CommonState } from '@/store/common/state'

/**
 * v2 横屏主区:与 v1 Main 行为一致(根据 navActiveId 切换 view),
 * 仅替换为 v2 views。
 */
const Main = () => {
  const [id, setId] = useState(commonState.navActiveId)

  useEffect(() => {
    const handleUpdate = (next: CommonState['navActiveId']) => {
      requestAnimationFrame(() => { setId(next) })
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
    }
  }, [])

  const component = useMemo(() => {
    switch (id) {
      case 'nav_songlist': return <SongList />
      case 'nav_top': return <Leaderboard />
      case 'nav_love': return <Mylist />
      case 'nav_setting': return <Setting />
      case 'nav_search':
      default: return <Search />
    }
  }, [id])

  return component
}

export default Main
