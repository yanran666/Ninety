const { baseURL } = require('../../utils/baseURL');
// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */

  data: {
    current: 0,
    autoplay: true,
    duration: 500,
    interval: 5000,
    selectedMode: '到店取',
    swiperList:[
      {
        value: `${baseURL}/public/images/carousel1.jpg`,
        ariaLabel: '图片1',
      },
      {
        value: `${baseURL}/public/images/carousel2.jpg`,
        ariaLabel: '图片2',
      },
      {
        value: `${baseURL}/public/images/carousel3.jpg`,
        ariaLabel: '图片3',
      },
      {
        value: `${baseURL}/public/images/carousel2.jpg`,
        ariaLabel: '图片2',
      },
    ],
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统状态栏高度（单位：px）
const { statusBarHeight } = wx.getDeviceInfo();

// 设置到页面数据中
this.setData({
  statusBarHeight: statusBarHeight
});
  },
  handleOrderClick(e) {
    const mode = e.currentTarget.dataset.mode; // ✅ 用 dataset 拿参数
    wx.setStorageSync('selectedMode', mode);   // ✅ 存入缓存
  
    wx.switchTab({
      url: '/pages/goods/goods'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
