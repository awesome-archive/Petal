'use strict'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Header, Image } from 'semantic-ui-react'

import { songLyricGET } from '../../../actions/fm/apis'
import { songLyricResponse } from '../../../actions/fm/types'

class Info extends Component {
  constructor(props) {
    super(props)
    this.state = {
      title: '',
      singer: '',
      avatar: '',
      albumTitle: '',
      lc: [],
      canScroll: false
    }
  }

  componentWillReceiveProps(nextProps) {
    const { pattern, song, lyric, recentSong, recentIndex, redheartSong, redheartIndex } = nextProps

    if (pattern === 'select' && song !== this.props.song) {
      this.setInfo(song[0])
    }

    if (pattern === 'recent' && (recentIndex !== this.props.recentIndex || pattern !== this.props.pattern)) {
      this.setInfo(recentSong[recentIndex], pattern)
    }

    if (pattern === 'redheart' && (redheartIndex !== this.props.redheartIndex || pattern !== this.props.pattern)) {
      this.setInfo(redheartSong[redheartIndex], pattern)
    }

    if (lyric !== this.props.lyric) {
      this.lyricOperation(lyric.lyric)
    }
  }

  setInfo = (song, pattern) => {
    this.setState({
      title: song.title,
      singer: song.singers[0].name,
      avatar: song.singers[0].avatar,
      albumTitle: song.albumtitle,
    })
    if (pattern === 'recent' || pattern === 'redheart') {
      this.props.lyricByRecentOrRedheart(song.sid, song.ssid)
    }
  }

  lyricOperation = lyric => {
    let newLc = this.handleLyric(lyric)
    this.setState({ lc: newLc.lyric, canScroll: newLc.canScroll }, () => {
      Array.from(document.querySelector('.lyric').children).some(line => {
        if (line.classList.contains('lyricGreen')) {
          line.classList.remove('lyricGreen')
          return true
        }
      })
      this.syncLyric()
    })
  }

  handleLyric = (lyric) => {
    let result = []
    const pattern = /\[\d{2}:\d{2}([\.\:]\d{2,3})?\]/g
    if (lyric === '暂无歌词') {
      result.push(lyric)
    }
    if (lyric.startsWith('\r\n')) {
      lyric = lyric.slice(2)
    }
    if (!lyric.startsWith('[') || !pattern.test(lyric)) {
      var re = lyric.split('\r\n').map(l => l.trim())
      return { lyric: re, canScroll: false }
    }

    if (pattern.test(lyric)) {
      let splitByNewline = lyric.split('\r\n')
      while (!pattern.test(splitByNewline[0])) {
        splitByNewline = splitByNewline.slice(1)
      }
      splitByNewline = splitByNewline.filter((l) => {
        return l !== ''
      })
      splitByNewline.forEach(l => {
        let time = l.match(pattern)
        let value = l.replace(pattern, '')
        if (time !== null) {
          time.forEach(item => {
            let t = item.slice(1, -1).split(':')
            result.push([value, parseInt(t[0]) * 60 + parseFloat(t[1])])
          })
        }
      })
      result.sort((a, b) => {
        return a[1] - b[1]
      })
      return {
        lyric: result.filter(l => {
          return l[0] !== ''
        }),
        canScroll: true
      }
    }
  }

  syncLyric = () => {
    const { pattern, recentSong, redheartSong } = this.props,
      audio = document.querySelector('#_audio'),
      lyricContainer = document.querySelector('.lyric'),
      lc = this.state.lc,
      canScroll = this.state.canScroll
    audio.ontimeupdate = null
    if (canScroll === false) { return }
    let index = 0

    audio.ontimeupdate = scrollLyric

    const cycle = () => {
      console.log('call cycle')
      audio.ontimeupdate = null
      audio.onended = null
      audio.onended = () => {
        lyricContainer.scrollTop = 0
        index = 0
        audio.ontimeupdate = scrollLyric
      }
    }

    function scrollLyric() {
      if (index === lc.length) {
        audio.removeEventListener('timeupdate', scrollLyric)
        if ((pattern === 'recent' && recentSong.length === 1) || (pattern === 'redheart' && recentSong.length === 1)) {
          return cycle()
        }
        return
      }
      let ct = audio.currentTime
      if (ct > lc[index][1]) {
        let lines = lyricContainer.children
        lines[index].classList.add('lyricGreen')
        if (index > 0) {
          lines[index - 1].classList.remove('lyricGreen')
          if (index > 3) {
            lyricContainer.scrollTop += lines[index - 1].clientHeight + 14
          }
        }
        index++
      }
    }
  }

  render() {
    const { title, singer, avatar, albumTitle, lc } = this.state
    return (
      <section>
        <div className='songTitleAndSinger'>
          <Header as='h3' id='title'>
            {title}
            <Header.Subheader>专辑: {albumTitle}</Header.Subheader>
          </Header>
          <Header as='h5'>
            <Image size='mini' shape='circular' src={avatar} className='avatar' />
            {singer}
          </Header>
        </div>
        <div className='lyric'>
          {lc.length > 0
            && typeof lc[0] === 'string'
            && lc[0] !== '暂无歌词'
            && <p className='cannotscroll'>歌词不支持滚动</p>}
          {lc.length > 0 && lc.map((l, i) => {
            return <p key={i}>{typeof l === 'string' ? l : l[0]}</p>
          })}
        </div>
      </section>
    )
  }
}

Info.propTypes = {
  pattern: PropTypes.string.isRequired,
  song: PropTypes.array.isRequired,
  recentSong: PropTypes.array,
  redheartSong: PropTypes.array,
  lyric: PropTypes.object.isRequired,
  recentIndex: PropTypes.number.isRequired,
  redheartIndex: PropTypes.number.isRequired,
  lyricByRecentOrRedheart: PropTypes.func.isRequired
}

const mapStateToProps = state => {
  return {
    pattern: state.fmReducer.pattern,
    song: state.fmReducer.song,
    recentSong: state.fmReducer.recent.songs,
    redheartSong: state.fmReducer.redheart,
    lyric: state.fmReducer.lyric,
    recentIndex: state.fmReducer.recentIndex,
    redheartIndex: state.fmReducer.redheartIndex
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    lyricByRecentOrRedheart: (sid, ssid) => {
      songLyricGET(sid, ssid).then(response => {
        dispatch(songLyricResponse(response.data))
      })
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Info)