const { baseURL } = require('../../../utils/baseURL');
Page({
  data: {
    favorites: []
  },

  onLoad() {
    const userInfo = getApp().globalData.userInfo;
    const user_id = userInfo ? userInfo.user_id : null;

    if (!user_id) return;

    wx.request({
      url: `${baseURL}/api/favorites/list`,
      method: 'GET',
      data: { user_id },
      success: (res) => {
        this.setData({ favorites: res.data });
      }
    });
  },

  goToDetail(e) {
    const { id, spec } = e.currentTarget.dataset;

    wx.navigateTo({
      url: `/subpackages/shop/detail/detail?id=${id}&spec=${encodeURIComponent(spec)}&fromCollect=true`
    });
  }
});
