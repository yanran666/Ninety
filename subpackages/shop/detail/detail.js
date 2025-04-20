const { baseURL } = require('../../../utils/baseURL');

Page({
  data: {
    product: null,
    selectedOptions: {
      ice: '',
      sweetness: '',
      strength: '',
    },
    specs: {
      ice: ['少冰', '正常冰', '多冰'],
      sweetness: ['无糖', '三分糖', '五分糖'],
      strength: ['微醺', '适中', '烈一点']
    },
    comments: [],

    // ❤️ 收藏
    isFavorited: false,
    grayHeartUrl: 'https://img.icons8.com/ios/50/cccccc/like--v1.png',
    redHeartUrl: 'https://img.icons8.com/ios-filled/50/fa314a/like--v1.png',

    // 🛒 购物车数量
    quantity: 1,
    totalPrice: 0
  },

  onLoad(options) {
    const productId = options.id;
    const fromCart = options.fromCart === 'true';
    const preSelectedSpec = decodeURIComponent(options.spec || '');
    const userInfo = getApp().globalData.userInfo;
    const user_id = userInfo ? userInfo.user_id : null;
  
    if (!productId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
  
    this.setData({ productId }); // 保存 id 方便收藏使用
  
    // 获取商品详情
    wx.request({
      url: `${baseURL}/api/products/${productId}`,
      success: (res) => {
        const product = res.data;
        if (!product || !product.price) {
          wx.showToast({ title: '商品数据有误', icon: 'none' });
          return;
        }
  
        let selectedOptions = {
          ice: this.data.specs.ice[0],
          sweetness: this.data.specs.sweetness[0],
          strength: this.data.specs.strength[0]
        };
  
        if (preSelectedSpec) {
          const [ice, sweetness, strength] = preSelectedSpec.split('/');
          selectedOptions = { ice, sweetness, strength };
        }
  
        this.setData({
          product,
          selectedOptions,
          quantity: 1,
          totalPrice: Number(product.price).toFixed(2)
        });
      }
    });
  
    // 查询是否已收藏
    wx.request({
      url: `${baseURL}/api/favorites/check`,
      method: 'GET',
      data: {
        user_id,
        product_id: productId
      },
      success: (res) => {
        this.setData({
          isFavorited: res.data.isFavorited
        });
      }
    });

    // 查询评论列表
    wx.request({
      url: `${baseURL}/api/reviews`,
      method: 'GET',
      data: { product_id: productId },
      success: (res) => {
        console.log('[商品评论]', res.data);
        const comments = res.data.map(r => ({
          ...r,
          score: Number(r.score)
        }));
        this.setData({
          comments
        });
      }
    });

    
  },

  // 切换规格
  selectSpec(e) {
    const { type, value } = e.currentTarget.dataset;
    this.setData({
      [`selectedOptions.${type}`]: value
    });
  },

  // ❤️ 切换收藏
  toggleFavorite() {
    const { isFavorited, productId, selectedOptions } = this.data;
    const userInfo = getApp().globalData.userInfo;
    const user_id = userInfo ? userInfo.user_id : null;
  
    const url = `${baseURL}/api/favorites`;
    const method = isFavorited ? 'DELETE' : 'POST';
  
    const spec = `${selectedOptions.ice}/${selectedOptions.sweetness}/${selectedOptions.strength}`;
  
    wx.request({
      url,
      method,
      header: {
        'content-type': 'application/json'
      },
      data: {
        user_id,
        product_id: productId,
        spec
      },
      success: () => {
        this.setData({ isFavorited: !isFavorited });
        wx.showToast({
          title: isFavorited ? '已取消收藏' : '已收藏',
          icon: 'success'
        });
      }
    });
  },

  // ➕ 数量加
  increaseQuantity() {
    const newQty = this.data.quantity + 1;
    this.setData({
      quantity: newQty,
      totalPrice: (newQty * this.data.product.price).toFixed(2)
    });
  },

  // ➖ 数量减
  decreaseQuantity() {
    const newQty = this.data.quantity > 1 ? this.data.quantity - 1 : 1;
    this.setData({
      quantity: newQty,
      totalPrice: (newQty * this.data.product.price).toFixed(2)
    });
  },

  addToCart() {
    const { product, quantity, selectedOptions } = this.data;
    const app = getApp();
  
    if (!product || !product.product_id) return;
  
    const specStr = `${selectedOptions.ice}/${selectedOptions.sweetness}/${selectedOptions.strength}`;
    const cart = app.globalData.cart || [];
  
    const existing = cart.find(item =>
      item.id === product.product_id &&
      item.selectedSpec === specStr
    );
  
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.product_id,
        name: product.name,
        image: product.image,
        removing: false,
        price: parseFloat(product.price),
        quantity,
        selectedSpec: specStr,
        checked: true
      });
    }
  
    // ✅ 同步更新 globalData 和本地缓存
    app.globalData.cart = cart;
    wx.setStorageSync('cart', cart);  // ⬅️ 这句放在操作完成之后！
  
    // ✅ 返回商品列表页并展示购物袋
    wx.reLaunch({
      url: '/pages/goods/goods?from=detail'
    });
  }
  

  
});
