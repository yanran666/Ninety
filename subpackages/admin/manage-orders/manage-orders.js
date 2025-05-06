// pages/manage-orders/manage-orders.js
const { baseURL } = require('../../../utils/baseURL');

Page({
  data: {
    orders: [],
    statusOptions: [
      { value: 1, label: '待处理' },
      { value: 2, label: '配送中' },
      { value: 3, label: '已完成' }
    ]
  },

  onLoad() {
    this.fetchOrders();
  },

  onShow() {
    this.fetchOrders();
  },

  // 拉取商家所有订单
  fetchOrders() {
    wx.request({
      url: `${baseURL}/api/orders/admin`,
      success: (res) => {
        const formatted = res.data.map(order => ({
          ...order,
          formattedTime: order.createdAt
            .replace('T', ' ')
            .replace(/\.\d+Z$/, '')
            .slice(0, 16),
          status: order.status ?? order.order_status, // 保底处理
          order_status: order.status ?? order.order_status  // 显式赋值
        }));
        this.setData({ orders: formatted });
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 修改订单状态
  updateStatus(e) {
    const order_id = e.currentTarget.dataset.id;
    const pickerIndex = Number(e.detail.value); // 拿到的是索引！
    const newStatus = this.data.statusOptions[pickerIndex].value; // 通过索引查真实值

    console.log('准备更新：', { order_id, pickerIndex, newStatus });
    wx.request({
      url: `${baseURL}/api/orders/${order_id}/status`,
      method: 'PUT',
      data: { order_status: newStatus },
      success: () => {
        wx.showToast({ title: '状态已更新', icon: 'success' });
        this.fetchOrders(); 
      },
      fail: () => {
        wx.showToast({ title: '更新失败', icon: 'none' });
      }
    });
  },

  // 删除订单
  deleteOrder(e) {
    const order_id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该订单？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${baseURL}/api/orders/${order_id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.fetchOrders();
            }
          });
        }
      }
    });
  }
});
