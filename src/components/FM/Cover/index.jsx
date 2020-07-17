import { Dimmer, Header, Icon, Image, Popup, Segment } from 'semantic-ui-react'
import React, { Component } from 'react'
import { onReceiveFromMainProcess, rendererProcessSend } from '../../../helper/electron'
import { playLog, playlistGET, songLyricGET } from '../../../actions/fm/apis'
import { playtimeSet, songListBack, songListGo, songListIndexSet, updateSidSsid } from '../../../actions/fm/actions'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
class Cover extends Component {
  constructor(props) {
    super(props)
    this.firstOpenWithPlayingChange = true
    this.state = {
      playing: false,
      song: {
        title: '',
        singers: [
          {
            avatar: '',
          },
        ],
        artist: '',
        picture: '',
      },
      love: 'white',
      isLoginPopup: false,
    }
  }

  componentDidMount() {
    onReceiveFromMainProcess('pause', this.handleAudioPlay)
    onReceiveFromMainProcess('love', this.handleLoveSong)
    onReceiveFromMainProcess('trash', this.handleTrashSong)
    onReceiveFromMainProcess('skip', this.handleSkipSong)
    onReceiveFromMainProcess('forward', this.handleSongForward)
    onReceiveFromMainProcess('backward', this.handleSongBackward)
  }

  componentWillReceiveProps(nextProps) {
    const { _id, pattern, songListIndex, song } = nextProps

    if (pattern === 'select' && song !== this.props.song) {
      if (this.props.openWithPlaying === false && this.firstOpenWithPlayingChange) {
        this.firstOpenWithPlayingChange = false
        this.setCover(song, pattern, false)
      } else {
        this.setCover(song, pattern)
      }
      return
    }

    if (pattern === 'redheart' && this.props.pattern !== 'redheart') {
      this.setCover(this.props.redheartSong[songListIndex], pattern)
      return
    }

    if (pattern === 'recent' && this.props.pattern !== 'recent') {
      this.setCover(this.props.recentSong[songListIndex], pattern)
      return
    }

    if (pattern === 'daily' && this.props.pattern !== 'daily') {
      this.setCover(this.props.dailySong[songListIndex], pattern)
      return
    }

    // if (pattern === 'sheet' && this.props.pattern !== 'sheet') {
    //   this.setCover(this.props.sheetSong[songListIndex], pattern)
    //   return
    // }

    if (songListIndex !== this.props.songListIndex && pattern === this.props.pattern) {
      if (pattern === 'redheart') {
        this.setCover(this.props.redheartSong[songListIndex], pattern)
        return
      }

      if (pattern === 'recent') {
        this.setCover(this.props.recentSong[songListIndex], pattern)
        return
      }

      if (pattern === 'daily') {
        this.setCover(this.props.dailySong[songListIndex], pattern)
        return
      }

      // if (pattern === 'sheet') {
      //   this.setCover(this.props.sheetSong[songListIndex], pattern)
      //   return
      // }
    }

    if (_id === 0 && this.props._id === 1) {
      this.setState({ love: 'white' }, () => {
        rendererProcessSend('FMRateColor', this.state.love)
      })
    }
  }

  /**
   * Set cover.Do following:
   *
   * 1. set song picture
   * 2. set current state, user already liked it?
   *
   * @param {Object} song
   * @param {string} pattern
   * @memberof Cover
   */
  setCover = (song, pattern, openWithPlaying = true) => {
    rendererProcessSend('trayLyricNextSong', song)
    rendererProcessSend('mprisSetMetadata', song)

    this.setState(
      {
        playing: openWithPlaying ? true : false,
        song,
        love: pattern === 'redheart' ? 'red' : song.like === 1 ? 'red' : 'white',
      },
      () => {
        rendererProcessSend('FMRateColor', this.state.love)
        rendererProcessSend('FMPauseAndStart', this.state.playing)
      }
    )
  }

  handleControlShow = () => this.setState({ controlPanelActive: true })
  handleControlHide = () => this.setState({ controlPanelActive: false })

  /**
   * Play or paused current song
   *
   * @memberof Cover
   */
  handleAudioPlay = () => {
    const audio = document.querySelector('#_audio')
    if (audio.paused) {
      audio.play()
      this.setState({ playing: true }, () => {
        rendererProcessSend('FMPauseAndStart', this.state.playing)
      })
    } else {
      audio.pause()
      this.setState({ playing: false }, () => {
        rendererProcessSend('FMPauseAndStart', this.state.playing)
      })
    }
  }

  handleSongForward = () => {
    const { pattern, recentSong, redheartSong, dailySong, songListIndex } = this.props

    if (pattern === 'select') {
      return
    }

    if (pattern === 'recent') {
      this.props.handlePlayLog(recentSong[songListIndex].sid, 'j', 'y')
      if (songListIndex === recentSong.length - 1) {
        this.props.handleSongListIndexSet(0)
        this.props.handleUpdateSidSsid(recentSong[0].sid, recentSong[0].ssid)
      } else {
        this.props.handleSongListGo()
        this.props.handleUpdateSidSsid(recentSong[songListIndex + 1].sid, recentSong[songListIndex + 1].ssid)
      }
      this.handleLyricUpdated()
    }

    if (pattern === 'redheart') {
      this.props.handlePlayLog(redheartSong[songListIndex].sid, 'j', 'h')
      if (songListIndex === redheartSong.length - 1) {
        this.props.handleSongListIndexSet(0)
        this.props.handleUpdateSidSsid(redheartSong[0].sid, redheartSong[0].ssid)
      } else {
        this.props.handleSongListGo()
        this.props.handleUpdateSidSsid(redheartSong[songListIndex + 1].sid, redheartSong[songListIndex + 1].ssid)
      }
      this.handleLyricUpdated()
    }

    if (pattern === 'daily') {
      this.props.handlePlayLog(dailySong[songListIndex].sid, 'j', 'd')
      if (songListIndex === dailySong.length - 1) {
        this.props.handleSongListIndexSet(0)
        this.props.handleUpdateSidSsid(dailySong[0].sid, dailySong[0].ssid)
      } else {
        this.props.handleSongListGo()
        this.props.handleUpdateSidSsid(dailySong[songListIndex + 1].sid, dailySong[songListIndex + 1].ssid)
      }
      this.handleLyricUpdated()
    }

    // if (pattern === 'sheet') {
    //   this.props.handlePlayLog(sheetSong[songListIndex].sid, 'j', 'n')
    //   if (songListIndex === sheetSong.length - 1) {
    //     this.props.handleSongListIndexSet(0)
    //   } else {
    //     this.props.handleSongListGo()
    //   }
    // }
  }

  handleSongBackward = () => {
    const { pattern, recentSong, redheartSong, dailySong, songListIndex } = this.props

    if (pattern === 'select') {
      return
    }

    if (pattern === 'recent') {
      this.props.handlePlayLog(recentSong[songListIndex].sid, 'k', 'y')
      if (songListIndex === 0) {
        this.props.handleSongListIndexSet(recentSong.length - 1)
        this.props.handleUpdateSidSsid(recentSong[recentSong.length - 1].sid, recentSong[recentSong.length - 1].ssid)
      } else {
        this.props.handleSongListBack()
        this.props.handleUpdateSidSsid(recentSong[songListIndex - 1].sid, recentSong[songListIndex - 1].ssid)
      }
      this.handleLyricUpdated()
    }

    if (pattern === 'redheart') {
      this.props.handlePlayLog(redheartSong[songListIndex].sid, 'k', 'h')
      if (songListIndex === 0) {
        this.props.handleSongListIndexSet(redheartSong.length - 1)
        this.props.handleUpdateSidSsid(
          redheartSong[redheartSong.length - 1].sid,
          redheartSong[redheartSong.length - 1].ssid
        )
      } else {
        this.props.handleSongListBack()
        this.props.handleUpdateSidSsid(redheartSong[songListIndex - 1].sid, redheartSong[songListIndex - 1].ssid)
      }
      this.handleLyricUpdated()
    }

    if (pattern === 'daily') {
      this.props.handlePlayLog(dailySong[songListIndex].sid, 'k', 'd')
      if (songListIndex === 0) {
        this.props.handleSongListIndexSet(dailySong.length - 1)
        this.props.handleUpdateSidSsid(dailySong[dailySong.length - 1].sid, dailySong[dailySong.length - 1].ssid)
      } else {
        this.props.handleSongListBack()
        this.props.handleUpdateSidSsid(dailySong[songListIndex - 1].sid, dailySong[songListIndex - 1].ssid)
      }
      this.handleLyricUpdated()
    }

    // if (pattern === 'sheet') {
    //   this.props.handlePlayLog(sheetSong[songListIndex].sid, 'k', 'n')
    //   if (songListIndex === 0) {
    //     this.props.handleSongListIndexSet(sheetSong.length - 1)
    //   } else {
    //     this.props.handleSongListBack()
    //   }
    // }
  }

  handleLyricUpdated = () => {
    if (this.props.lyricGlobalDisplay) {
      this.props.handleSongLyricGET()
    }
  }

  handleSkipSong = () => {
    if (this.props.pattern !== 'select') {
      return
    }

    this.props.handlePlaytimeSet(Number.parseFloat(this.props.audio.currentTime).toFixed(3))
    this.props.getPlayList('skip', this.handleLyricUpdated)
  }

  handleTrashSong = () => {
    if (this.props.pattern !== 'select') {
      return
    }

    this.props.handlePlaytimeSet(Number.parseFloat(this.props.audio.currentTime).toFixed(3))
    this.props.getPlayList('trash', this.handleLyricUpdated)
  }

  /**
   * Handle like current song.Must login.
   * Now apply with three patterns
   *
   * 1. select
   * 2. recent
   * 3. redheart
   *
   * @memberof Cover
   */
  handleLoveSong = () => {
    const { _id, pattern, getPlayList, recentSong, redheartSong, dailySong, songListIndex } = this.props
    const { love } = this.state
    if (_id === 0) {
      this.handleLoveIsLoginPopupOpen()
      return
    }

    this.props.handlePlaytimeSet(Number.parseFloat(this.props.audio.currentTime).toFixed(3))

    if (love === 'white') {
      if (pattern === 'select') {
        getPlayList('rate')
      }

      if (pattern === 'recent') {
        this.props.handlePlayLog(recentSong[songListIndex].sid, 'r', 'y')
      }

      if (pattern === 'redheart') {
        this.props.handlePlayLog(redheartSong[songListIndex].sid, 'r', 'h')
      }

      if (pattern === 'daily') {
        this.props.handlePlayLog(dailySong[songListIndex].sid, 'r', 'd')
      }

      // if (pattern === 'sheet') {
      //   this.props.handlePlayLog(sheetSong[songListIndex].sid, 'r', 'n')
      // }

      this.setState({ love: 'red' }, () => {
        rendererProcessSend('FMRateColor', this.state.love)
      })
    }

    if (love === 'red') {
      if (pattern === 'select') {
        getPlayList('unrate')
      }

      if (pattern === 'recent') {
        this.props.handlePlayLog(recentSong[songListIndex].sid, 'u', 'y')
      }

      if (pattern === 'redheart') {
        this.props.handlePlayLog(redheartSong[songListIndex].sid, 'u', 'h')
      }

      if (pattern === 'daily') {
        this.props.handlePlayLog(dailySong[songListIndex].sid, 'u', 'd')
      }

      // if (pattern === 'sheet') {
      //   this.props.handlePlayLog(sheetSong[songListIndex].sid, 'u', 'n')
      // }

      this.setState({ love: 'white' }, () => {
        rendererProcessSend('FMRateColor', this.state.love)
      })
    }
  }

  handleLoveIsLoginPopupOpen = () => {
    this.setState({ isLoginPopup: true })
    this.PopupTimeout = setTimeout(() => {
      this.setState({ isLoginPopup: false })
    }, 3000)
  }

  handleLoveIsLoginPopupClose = () => {
    this.setState({ isLoginPopup: false })
    clearTimeout(this.PopupTimeout)
  }

  render() {
    const { pattern } = this.props
    const { controlPanelActive, playing, love, isLoginPopup, song } = this.state
    const controlPanel = (
      <div>
        <div className="play-pause" onClick={this.handleAudioPlay}>
          <Icon name={playing ? 'pause' : 'play'} size="large" />
        </div>
        <div className="heart-trash-forward">
          {pattern === 'select' && (
            <div>
              <Popup
                trigger={<Icon name="heart" size="big" style={{ color: love }} onClick={this.handleLoveSong} />}
                content="想要喜欢歌曲，请先登录"
                position="bottom center"
                on="click"
                open={isLoginPopup}
                onClose={this.handleLoveIsLoginPopupClose}
              />
              <Icon name="trash" size="big" onClick={this.handleTrashSong} />
              <Icon name="step forward" size="big" onClick={this.handleSkipSong} />
            </div>
          )}
          {(pattern === 'recent' || pattern === 'redheart' || pattern === 'daily') && (
            <div>
              <Icon name="step backward" size="big" onClick={this.handleSongBackward} />
              <Icon name="heart" size="big" style={{ color: love }} onClick={this.handleLoveSong} />
              <Icon name="step forward" size="big" onClick={this.handleSongForward} />
            </div>
          )}
        </div>
      </div>
    )

    return (
      <article className="petal-cover">
        <Segment basic className="info">
          <Header title={song.title} className="title">
            <Image src={song.singers[0].avatar} size="small" circular className="artist" />
            <Header.Content className="dothidden">
              {song.title}
              <Header.Subheader title={song.artist} className="dothidden">
                {song.artist}
              </Header.Subheader>
            </Header.Content>
          </Header>
        </Segment>
        <Dimmer.Dimmable
          className="cover"
          as={Image}
          blurring={true}
          dimmed={controlPanelActive}
          dimmer={{ active: controlPanelActive, content: controlPanel }}
          onMouseEnter={this.handleControlShow}
          onMouseLeave={this.handleControlHide}
          src={song.picture}
          rounded
          fluid
        />
      </article>
    )
  }
}

Cover.propTypes = {
  pattern: PropTypes.string.isRequired,
  song: PropTypes.object.isRequired,
  recentSong: PropTypes.array,
  redheartSong: PropTypes.array,
  dailySong: PropTypes.array,
  // sheetSong: PropTypes.array,
  getPlayList: PropTypes.func.isRequired,
  _id: PropTypes.number.isRequired,
  songListIndex: PropTypes.number.isRequired,
  handleSongListGo: PropTypes.func,
  handleSongListBack: PropTypes.func,
  handleSongListIndexSet: PropTypes.func,
  handlePlayLog: PropTypes.func,
  handlePlaytimeSet: PropTypes.func,
  lyricGlobalDisplay: PropTypes.bool,
  handleSongLyricGET: PropTypes.func,
  handleUpdateSidSsid: PropTypes.func,
  openWithPlaying: PropTypes.bool,
}

const mapStateToProps = (state) => ({
  pattern: state.fmReducer.pattern,
  song: state.fmReducer.song,
  _id: state.authReducer._id,
  recentSong: state.fmReducer.recent.songs,
  redheartSong: state.fmReducer.redheart,
  dailySong: state.fmReducer.daily.songs,
  // sheetSong: state.fmReducer.sheet,
  songListIndex: state.fmReducer.songListIndex,
  lyricGlobalDisplay: state.fmReducer.lyricDisplay,
  openWithPlaying: state.settingReducer.openWithPlaying,
})

const mapDispatchToProps = (dispatch) => ({
  getPlayList: (type, callback) => dispatch(playlistGET(type, callback)),
  handleSongListGo: () => dispatch(songListGo()),
  handleSongListBack: () => dispatch(songListBack()),
  handleSongListIndexSet: (index) => dispatch(songListIndexSet(index)),
  handlePlayLog: (sid, type, play_source) => dispatch(playLog(sid, type, play_source)),
  handlePlaytimeSet: (pt) => dispatch(playtimeSet(pt)),
  handleSongLyricGET: () => dispatch(songLyricGET()),
  handleUpdateSidSsid: (sid, ssid) => dispatch(updateSidSsid(sid, ssid)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Cover)
