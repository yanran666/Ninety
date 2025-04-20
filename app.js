// app.js
const { baseURL } = require('./utils/baseURL');

App({
  globalData: {
    openid: null,
    userInfo: null,
    cart: []
  },
  "permission": {
    "scope.userLocation": {
      "desc": "我们将获取你的地理位置以提供外送服务"
    }
  },
  

  onLaunch() {
    // 本地日志（可留可删）
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 第一步：登录并获取 code
    wx.login({
      success: res => {
        if (res.code) {
          // 第二步：发送 code 给后端，换取 openid
          wx.request({
            url: `${baseURL}/api/wechat/login`, // 你的后端接口地址
            method: 'POST',
            data: { code: res.code },
            success: (res) => {
              const openid = res.data.openid;
              this.globalData.openid = openid;
              console.log('✅ openid 获取成功：', openid);
              wx.setStorageSync('openid', openid);

              // 第三步：注册或登录用户（将 openid 存到数据库）
              wx.request({
                url: `${baseURL}/api/users`,
                method: 'POST',
                data: {
                  openid: openid,
                  nickname: '游客用户', 
                  avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                },
                success: (res) => {
                  console.log('✅ 用户登录/注册成功：', res.data);
                  this.globalData.userInfo = res.data;
                },
                fail: (err) => {
                  console.error('❌ 用户注册接口失败', err);
                }
              });
            },
            fail: () => {
              console.error('❌ 获取 openid 失败');
            }
          });
        } else {
          console.error('❌ wx.login 失败：', res.errMsg);
        }
      }
    });
  }
});
