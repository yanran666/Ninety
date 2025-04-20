const { baseURL } = require('../../utils/baseURL');
Page({
  data: {
    categorizedProducts: [],
    activeAnchorId: '' ,
    activeCategoryIndex: 0,
    cartPopupAnimation: {},
    selectedMode: '到店取',
    locationText: '酒零酒馆 >',

    
    // 🛒 购物车浮动卡片相关
    hideCartPopup: false,
    showCartBar: false,
    showCartPopup: false,    // 显示购物车弹出卡片
    cartList: [],            // 🛒 当前购物车列表
    cartCount: 0,            // 数量
    cartTotal: 0.00,         // 总价
    isAllSelected: true      // 全选状态
  },

  goToDetail(e) {
    const productId = e.currentTarget.dataset.id;
    if (!productId) {
      console.error('❌ 未获取到商品 ID');
      return;
    }
  
    const targetUrl = `/subpackages/shop/detail/detail?id=${productId}`;
    console.log('✅ 跳转路径:', targetUrl);
  
    wx.navigateTo({
      url: targetUrl
    });
  },

  onLoad(options) {
    const mode = options.mode || '到店取';
    this.setData({
      selectedMode: mode
    });
    // ✅ 请求商品数据
    wx.request({
      url: `${baseURL}/api/products`,
      method: 'GET',
      success: (res) => {
        const products = Array.isArray(res.data) ? res.data : [];
  
        const categories = [...new Set(products.map(p => p.category))];
        const categorizedProducts = categories.map((cat, index) => ({
          category: cat,
          anchorId: `cat${index}`,
          products: products.filter(p => p.category === cat)
        }));
  
        this.setData({ categorizedProducts });
      }
    });
  
    // ✅ 加载缓存中的购物车
    const cart = wx.getStorageSync('cart') || [];
    const app = getApp();
    app.globalData.cart = cart;
  
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
    this.setData({
      cartList: cart,
      cartCount: count,
      cartTotal: total.toFixed(2),
      showCartBar: count > 0
    });
  },
  
  onShow() {
    const cart = wx.getStorageSync('cart') || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const mode = wx.getStorageSync('selectedMode') || '到店取';
    this.fetchProductList();
    this.setData({
      selectedMode: mode,
      cartList: cart,
      cartCount: count,
      cartTotal: total.toFixed(2),
      showCartBar: count > 0
    });
  
    this.syncGlobalCart(cart); // ✅ 如果你要同步 globalData 也可以保留这句
  },
  

  scrollToCategory(e) {
    const index = e.currentTarget.dataset.index;
    const anchorId = e.currentTarget.dataset.id;
    this.setData({
      activeAnchorId: anchorId,
      activeCategoryIndex: index
    });
  },

  syncGlobalCart(cartList) {
    const app = getApp();
    app.globalData.cart = cartList;
  },

  
  onProductScroll(e) {
    const scrollTop = e.detail.scrollTop;

    const query = wx.createSelectorQuery();
    query.selectAll('.category_block').boundingClientRect();
    query.select('.product_list').boundingClientRect(); 
    query.exec((res) => {
      const blocks = res[0];
      const container = res[1];
      const containerTop = container.top;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.top <= containerTop + 10 && block.bottom > containerTop + 10) {
          if (this.data.activeCategoryIndex !== i) {
            this.setData({
              activeCategoryIndex: i
            });
          }
          break;
        }
      }
    });
  },

  // ✅ 加入购物车：增加商品数量 + 总价
  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    if (!product || !product.price) return;
  
    // ✅ 先从缓存或 globalData 中拿最新购物车
    const storedCart = wx.getStorageSync('cart') || [];
    let currentCartList = storedCart.length > 0 ? storedCart : this.data.cartList;
  
    const existing = currentCartList.find(p => p.id === product.product_id);
    let newCartList = [...currentCartList];
  
    if (existing) {
      existing.quantity += 1;
    } else {
      newCartList.push({
        id: product.product_id,
        name: product.name,
        image: product.image,
        price: parseFloat(product.price),
        quantity: 1,
        selectedSpec: "少冰/无糖/微醺", // ✅ 示例规格
        checked: true
      });
    }
  
    // ✅ 统一更新逻辑
    this.updateCartState(newCartList);
  },
  
  

  // ✅ 跳转结算页面
  goToCheckout() {
    wx.setStorageSync('checkoutItems', this.data.cartList);
    wx.setStorageSync('checkoutMode', this.data.selectedMode);
    wx.setStorageSync('checkoutLocation', this.data.locationText);

    wx.navigateTo({
      url: '/subpackages/shop/checkout/checkout'
    });
  },
  toggleCartPopup() {
    const show = !this.data.showCartPopup;
  
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-in-out',
    });
  
    if (!show) {
      // ❌ 关闭时：先下滑动画，再隐藏元素
      animation.translateY(100).opacity(0).step();
      this.setData({
        cartPopupAnimation: animation.export(),
      });
  
      setTimeout(() => {
        this.setData({
          showCartPopup: false,
        });
      }, 300);
    } else {
      // ✅ 打开时：重置位置并展示
      this.setData({
        showCartPopup: true,
      });
  
      setTimeout(() => {
        animation.translateY(0).opacity(1).step();
        this.setData({
          cartPopupAnimation: animation.export(),
        });
      }, 50);
    }
  },
  

  toggleSelectAllManual() {
    const isAll = !this.data.isAllSelected;
    const updatedList = this.data.cartList.map(item => ({ ...item, checked: isAll }));
  
    this.setData({
      isAllSelected: isAll,
      cartList: updatedList
    });
  },
  
  
  toggleItemCheck(e) {
    const id = e.currentTarget.dataset.id;
    const updatedList = this.data.cartList.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
  
    const isAll = updatedList.every(i => i.checked);
  
    this.setData({
      cartList: updatedList,
      isAllSelected: isAll
    });
  },

  deleteSelected() {
    const list = [...this.data.cartList];
    const listWithAnimation = list.map(item => item.checked ? { ...item, removing: true } : item);
  
    const remaining = list.filter(item => !item.checked);
  
    this.setData({ cartList: listWithAnimation });
  
    setTimeout(() => {
      const updated = remaining.map(item => ({ ...item, removing: false }));
      this.setData({ cartList: updated }, () => this.recalculateCart(updated));
    }, 400);
  },

  // 减少数量：减到 0 就移除
  decreaseCartQuantity(e) {
    const id = e.currentTarget.dataset.id;
    let list = [...this.data.cartList];
    const index = list.findIndex(item => item.id === id);
  
    if (index === -1) return;
  
    if (list[index].quantity > 1) {
      list[index].quantity -= 1;
      this.setData({ cartList: list }, () => this.recalculateCart(list));
    } else {
      list[index].removing = true;
      this.setData({ cartList: list });
  
      setTimeout(() => {
        list.splice(index, 1);
        list = list.map(item => ({ ...item, removing: false }));
        this.setData({ cartList: list }, () => this.recalculateCart(list));
      }, 400);
    }
  },


  recalculateCart(cartList = this.data.cartList) {
  const activeItems = cartList.filter(item => !item.removing);
  const count = activeItems.reduce((sum, p) => sum + p.quantity, 0);
  const total = activeItems.reduce((sum, p) => sum + p.price * p.quantity, 0);

  wx.setStorageSync('cart', cartList);

  if (count === 0) {
    const animation = wx.createAnimation({ duration: 300, timingFunction: 'ease-in-out' });
    animation.translateY(100).opacity(0).step();

    this.setData({
      cartPopupAnimation: animation.export(),
      hideCartPopup: true,
    });

    setTimeout(() => {
      this.setData({
        showCartBar: false,
        showCartPopup: false,
        cartList: [],
        cartCount: 0,
        cartTotal: '0.00',
        hideCartPopup: false
      }, () => {
        this.syncGlobalCart([]); // ✅ 清空全局数据
      });
    }, 300);
  } else {
    this.setData({
      cartList: activeItems,
      cartCount: count,
      cartTotal: total.toFixed(2),
      showCartBar: true,
      showCartPopup: true
    }, () => {
      this.syncGlobalCart(activeItems);
    });
  }
},
  
// 增加数量：直接 +1
increaseCartQuantity(e) {
  const id = e.currentTarget.dataset.id;
  const updatedList = this.data.cartList.map(item => {
    if (item.id === id) {
      item.quantity += 1;
    }
    return item;
  });

  this.updateCartState(updatedList);
},

// ✅ 更新购物车状态（同步数量/总价/是否隐藏购物栏）
updateCartState(cartList) {
  const count = cartList.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartList.reduce((sum, item) => sum + item.price * item.quantity, 0);

  wx.setStorageSync('cart', cartList);

  const app = getApp();
  app.globalData.cart = cartList;

  this.setData({
    cartList,
    cartCount: count,
    cartTotal: total.toFixed(2),
    showCartBar: count > 0,
    showCartPopup: count > 0
  });
},
reselectSpec(e) {
  const id = e.currentTarget.dataset.id;
  const spec = e.currentTarget.dataset.spec;
  let cart = this.data.cartList;

  // 移除对应 id + 规格的商品
  cart = cart.filter(item => !(item.id === id && item.selectedSpec === spec));

  // 更新本地和缓存
  this.setData({ cartList: cart });
  wx.setStorageSync('cart', cart);
  getApp().globalData.cart = cart;

  // 跳转带参
  wx.navigateTo({
    url: `/subpackages/shop/detail/detail?id=${id}&spec=${encodeURIComponent(spec)}&fromCart=true`
  });
},
switchMode(e) {
  const mode = e.currentTarget.dataset.mode;

  this.setData({
    selectedMode: mode
  });

  if (mode === '喜外送') {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        const { latitude, longitude } = res;

        // 逆地址解析（推荐用腾讯地图SDK，但我们这里简化处理）
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=LXLBZ-ZGN6H-Y7UDN-WHJPE-5WIC5-JXBEY`, // 替换为你的腾讯位置服务Key
          success: (res) => {
            const address = res.data.result.address;
            this.setData({
              locationText: address
            });
          },
          fail: () => {
            this.setData({
              locationText: '电子科技大学中山学院'
            });
          }
        });
      },
      fail: () => {
        // wx.showToast({ title: '需要授权定位', icon: 'none' });
        this.setData({
          locationText: '电子科技大学中山学院 >'
        });
      }
    });
  } else {
    // 到店取：还原默认显示
    this.setData({
      locationText: '酒零酒馆 >'
    });
  }
},

fetchProductList() {
  wx.request({
    url: `${baseURL}/api/products`,
    method: 'GET',
    success: (res) => {
      const products = Array.isArray(res.data) ? res.data : [];

      const categories = [...new Set(products.map(p => p.category))];
      const categorizedProducts = categories.map((cat, index) => ({
        category: cat,
        anchorId: `cat${index}`,
        products: products.filter(p => p.category === cat)
      }));

      this.setData({ categorizedProducts }); // ✅ 必须设置它
    }
  });
}







});
