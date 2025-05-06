const { baseURL } = require('../../utils/baseURL');

Page({
  data: {
    order: []
  },
  onShow() {
    const userInfo = getApp().globalData.userInfo;
    const user_id = userInfo ? userInfo.user_id : null;

    if (!user_id) {
      wx.showToast({ title: '用户未登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${baseURL}/api/orders`, // ✅ 使用新的查询接口
      method: 'GET',
      data: { user_id },
      success: (res) => {
        // 先把数组倒序、然后格式化时间
        const formatted = res.data.reverse().map(order => ({
          ...order,
          // 格式化 createdAt 字符串，去掉 T、毫秒和 Z，只保留到分钟
          formattedTime: order.createdAt
            .replace('T', ' ')
            .replace(/\.\d+Z$/, '')
            .slice(0, 16)
        }));
        this.setData({ orders: formatted });
      },
      fail: (err) => {
        console.error('[获取订单失败]', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  goToReview(e) {
    const order_id = e.currentTarget.dataset.orderid;
    const product_id = e.currentTarget.dataset.productid;
  
    const targetOrder = this.data.orders.find(order => order.order_id == order_id);
    wx.setStorageSync('reviewTargetOrder', targetOrder); // ✅ 存下来
  
    wx.navigateTo({
      url: `/subpackages/user/review/review?order_id=${order_id}&product_id=${product_id}`
    });
  }
  
  
});
