import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Header, Image, Form, Button, Dimmer, Loader, Message } from 'semantic-ui-react'
import { authLoginFail, authRemoveFailMessage } from '../../actions/auth/actions'
import { authPost } from '../../actions/auth/apis'
import { openInDefaultBrowser } from '../../helper/electron'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      password: '',
    }
  }

  componentDidMount() {
    document.querySelector('.fm-region').style.display = 'none'
  }

  componentWillUnmount() {
    if (this.props.history.location.pathname === '/') {
      document.querySelector('.fm-region').style.display = 'flex'
    }
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value })
  }

  handleLoginSubmit = (e) => {
    e.preventDefault()
    const { username, password } = this.state
    const { handleAuthPost, handleAuthLoginFail } = this.props

    if (username === '' || password === '') {
      handleAuthLoginFail('账号或密码不能为空')
    } else {
      handleAuthPost({ username, password }, () => this.props.history.push('/'))
    }
  }

  render() {
    const { isFetching, loginFail, loginFailMessage } = this.props
    const { username, password } = this.state

    return (
      <article className="petal-login">
        <Header as="h1" textAlign="center" className="login-header">
          <Image src="./resources/petal.svg" size="huge" />
          <span>Petal</span>
        </Header>
        <Dimmer.Dimmable dimmed>
          <Dimmer active={isFetching} inverted>
            <Loader>加载中</Loader>
          </Dimmer>
          <Form className="login-form">
            {loginFail && (
              <Message size="small" negative onDismiss={this.props.handleRemoveLoginFailMessage}>
                <Message.Header>登录失败</Message.Header>
                <p>{loginFailMessage}</p>
              </Message>
            )}
            <Form.Input name="username" value={username} onChange={this.handleInputChange} placeholder="豆瓣账号" />
            <Form.Input
              type="password"
              name="password"
              value={password}
              onChange={this.handleInputChange}
              placeholder="密码"
            />
            <Button fluid color="green" onClick={this.handleLoginSubmit}>
              登 录
            </Button>
          </Form>
        </Dimmer.Dimmable>
        <p className="login-extra">
          没有豆瓣账号? <span onClick={openInDefaultBrowser('https://www.douban.com')}>去注册</span>
        </p>
      </article>
    )
  }
}

Login.propTypes = {
  handleAuthPost: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  loginFail: PropTypes.bool.isRequired,
  loginFailMessage: PropTypes.string.isRequired,
  handleAuthLoginFail: PropTypes.func.isRequired,
  handleRemoveLoginFailMessage: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
  isFetching: state.authReducer.isFetching,
  loginFail: state.authReducer.loginFail,
  loginFailMessage: state.authReducer.loginFailMessage,
})

const mapDispatchToProps = (dispatch) => ({
  handleAuthPost: (usernameAndPassword, callback) => dispatch(authPost(usernameAndPassword, callback)),
  handleAuthLoginFail: (message) => dispatch(authLoginFail(message)),
  handleRemoveLoginFailMessage: () => dispatch(authRemoveFailMessage()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)
