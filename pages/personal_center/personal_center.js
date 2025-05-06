const { baseURL } = require('../../utils/baseURL');

Page({
  data: {
    isAdmin: false
  },

  onShow() {
    this.setData({
      isAdmin: wx.getStorageSync('isAdmin') || false
    });
  },

  toggleRole() {
    const newRole = !this.data.isAdmin;
    wx.setStorageSync('isAdmin', newRole);
    this.setData({ isAdmin: newRole });

    wx.showToast({
      title: newRole ? '切换为商家' : '切换为用户',
      icon: 'none'
    });
  },

  goToManageGoods() {
    wx.navigateTo({
      url: '/subpackages/admin/manage-goods/manage-goods'
    });
  },

  goToManageOrders() {
    wx.navigateTo({ url: '/subpackages/admin/manage-orders/manage-orders' });
  },

  clearCart() {
    wx.removeStorageSync('cart');
    wx.showToast({ title: '购物车已清空', icon: 'none' });
  },

  clearOrders() {
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo) return;
  
    wx.showModal({
      title: '提示',
      content: '确定要清空所有订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${baseURL}/api/orders/clear`,
            method: 'DELETE',
            header: { 'content-type': 'application/json' },
            data: { user_id: userInfo.user_id },
            success: () => {
              wx.showToast({ title: '订单已清空' });
              wx.removeStorageSync('orders'); // 同步清除缓存
            }
          });
        }
      }
    });
  }
  ,
  goToFavorites() {
    wx.navigateTo({
      url: '/subpackages/user/favorites/favorites'
    });
  }
  
});
