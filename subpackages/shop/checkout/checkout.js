const { baseURL } = require('../../../utils/baseURL');
Page({
  data: {
    deliveryMethod: '到店取', // 或 '喜外送'
    deliveryTimeStart: '',
    deliveryTimeEnd: '',
    selectedEatType: '外带',
    cartItems: [], 
    totalPrice: 0 ,
    remarkText: '',
    showRemarkModal: false,
    phoneNumber: '18888888888',
    phoneInputFocused: false
  },

  onLoad() {

    const mode = wx.getStorageSync('checkoutMode') || '到店取';
    const location = wx.getStorageSync('checkoutLocation') || '';
    const items = wx.getStorageSync('checkoutItems') || [];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
    this.setData({
      deliveryMethod: mode,
      locationText: location,
      cartItems: items,           // ✅ 设置商品明细数据
      totalPrice: total.toFixed(2) // ✅ 设置小计
    });
  
    if (mode === '喜外送') {
      this.calcDeliveryTime(); // 送达时间计算
    }
  },

  calcDeliveryTime() {
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60 * 1000);
    const end = new Date(now.getTime() + 30 * 60 * 1000);

    const format = (t) => {
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    this.setData({
      deliveryTimeStart: format(start),
      deliveryTimeEnd: format(end)
    });
  },
  selectEatType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedEatType: type
    });
  },
    // 打开备注弹窗
  openRemarkModal() {
    this.setData({ showRemarkModal: true });
  },

  onRemarkInput(e) {
    this.setData({ remarkText: e.detail.value });
  },

  cancelRemark() {
    this.setData({ showRemarkModal: false });
  },

  confirmRemark() {
    this.setData({ showRemarkModal: false });
  },

  // 手机号修改
  onPhoneInput(e) {
    this.setData({ phoneNumber: e.detail.value });
  },

  focusPhoneInput() {
    this.setData({
      phoneInputFocused: true
    });
  },
  // 当用户手动点空白处或输完后，input 失焦
  onPhoneBlur() {
    this.setData({
      phoneInputFocused: false
    });
  },

  submitOrder() {
    wx.showModal({
      title: '微信支付',
      content: `确认支付 ￥${this.data.totalPrice} 吗？`,
      confirmText: '确认支付',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.createOrder(true); // 支付成功
        } else {
          this.createOrder(false); // 模拟未支付
        }
      }
    });
  },
  formatTime(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  },

  createOrder(isPaid) {
    const order = {
      items: this.data.cartItems,
      remark: this.data.remarkText,
      phone: this.data.phoneNumber,
      total_price: this.data.totalPrice,
      status: isPaid ? 'paid' : 'unpaid',
      deliveryMethod: this.data.deliveryMethod,
      locationText: this.data.locationText,
      createdAt: this.formatTime(new Date())
    };

    const user_id = getApp().globalData.userInfo?.user_id;

    // 同步写入后端数据库
    wx.request({
      url: `${baseURL}/api/orders/create`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        ...order,
        user_id
      },
      success: (res) => {
        console.log('✅ 后端订单已创建：', res.data);

        // 你可以把后端返回的 order_id 加到本地订单里
        const newOrder = { ...order, order_id: res.data.order_id, reviewed: false };

        const orders = wx.getStorageSync('orders') || [];
        const updatedOrders = [newOrder, ...orders];

        wx.setStorageSync('orders', updatedOrders);
        wx.setStorageSync('latestOrder', newOrder);

        // 清除购物车中已勾选的商品
        const remaining = this.data.cartItems.filter(item => !item.checked);
        wx.setStorageSync('cart', remaining);
        getApp().globalData.cart = remaining;

        // 跳转页面
        wx.switchTab({ url: '/pages/order/order' });
      },
      fail: (err) => {
        console.error('❌ 写入订单失败', err);
        wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
      }
    });
  }
  
  
  

  
});
