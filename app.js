// app.js
App({
  globalData: {
    openid: null,
    userInfo: null,
    cart: []
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
            url: 'http://127.0.0.1:3000/api/wechat/login', // 你的后端接口地址
            method: 'POST',
            data: { code: res.code },
            success: (res) => {
              const openid = res.data.openid;
              this.globalData.openid = openid;
              console.log('✅ openid 获取成功：', openid);

              // 第三步：注册或登录用户（将 openid 存到数据库）
              wx.request({
                url: 'http://127.0.0.1:3000/api/users',
                method: 'POST',
                data: {
                  openid: openid,
                  nickname: '游客用户', // 可后续替换为用户信息
                  avatar: 'https://example.com/avatar.png',
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
