const { baseURL } = require('../../../utils/baseURL');

Page({
  data: {
    product: null,
    order: null,
    order_id: null,
    product_id: null,
    score: 0,
    content: ''
  },

  onLoad(options) {
    const { order_id, product_id } = options;
    console.log('[跳转参数]', options);
  
    const order = wx.getStorageSync('reviewTargetOrder');
    if (!order) {
      console.warn('[目标订单] 未找到');
      return;
    }
  
    const product = order.items.find(item => item.product_id == product_id);
    console.log('[对应商品]', product);
  
    this.setData({
      order_id,
      product_id,
      product: product || {}
    });
  },

  selectScore(e) {
    const score = e.currentTarget.dataset.index;
    this.setData({ score });
  },

  onReviewInput(e) {
    this.setData({ content: e.detail.value });
  },

  submitReview() {
    const { order_id, product_id, score, content } = this.data;
    const userInfo = getApp().globalData.userInfo;
  
    if (score === 0 || !content) {
      wx.showToast({ title: '请完整填写', icon: 'none' });
      return;
    }
  
    wx.request({
      url: `${baseURL}/api/reviews`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        order_id,
        product_id,
        user_id: userInfo.user_id,
        score,
        comment: content
      },
      success: () => {
        wx.showToast({ title: '感谢评价', icon: 'success' });
  
        // ✅ 评论成功后，更新本地订单缓存中对应商品的 reviewed 状态
        const orders = wx.getStorageSync('orders') || [];
        const updatedOrders = orders.map(order => {
          if (order.order_id == order_id) {
            order.items = order.items.map(item => {
              if (item.product_id == product_id) {
                return { ...item, reviewed: true };
              }
              return item;
            });
          }
          return order;
        });
  
        wx.setStorageSync('orders', updatedOrders);
  
        // ✅ 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 800);
      },
      fail: (err) => {
        console.error('[提交失败]', err);
        wx.showToast({ title: '提交失败', icon: 'none' });
      }
    });
  }
  
  
  
});
