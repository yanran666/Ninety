const { baseURL } = require('../../../utils/baseURL');

Page({
  data: {
    products: []
  },

  onLoad() {
    wx.request({
      url: `${baseURL}/api/products`,
      success: (res) => {
        this.setData({ products: res.data });
      }
    });
  },

  handleInput(e) {
    const { id, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const updated = this.data.products.map(p => {
      if (p.product_id == id) {
        p[field] = value;
      }
      return p;
    });
    this.setData({ products: updated });
  },

  saveProduct(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.product_id == id);
    console.log('▶️ saveProduct 提交给后端:', product);
  
    wx.request({
      url: `${baseURL}/api/products/${id}`,
      method: 'PUT',
      header: { 'content-type':'application/json' },
      data: product,
      success: () => wx.showToast({ title:'保存成功', icon:'success' }),
      fail: (err) => {
        console.error('❌ 保存接口调用失败:', err);
        wx.showToast({ title:'保存失败', icon:'none' });
      }
    });
  },

  addProduct() {
    const defaultProduct = {
      name: '新商品',
      price: 0.01,
      stock: 0,
      category: '未分类',
      description: '',
      image: 'https://images.icon-icons.com/2218/PNG/512/celebration_wine_champion_drink_party_icon_134287.png'
    };
  
    wx.request({
      url: `${baseURL}/api/products/add`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: defaultProduct,
      success: (res) => {
        if (!res.data.insertId) {
          wx.showToast({ title: '添加失败', icon: 'none' });
          return;
        }
  
        const newProduct = {
          ...defaultProduct,
          product_id: res.data.insertId  // ✅ 插入后拿到的 ID！
        };
  
        // ✅ 只有拿到 ID 后才插入到 products 列表中
        this.setData({
          products: [newProduct, ...this.data.products]
        });
  
        wx.showToast({ title: '添加成功', icon: 'success' });
      }
    });
  },
  confirmDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '是否删除该商品？',
      success: (res) => {
        if (res.confirm) {
          this.deleteProduct(id);
        }
      }
    });
  },
  
  deleteProduct(id) {
    wx.request({
      url: `${baseURL}/api/products/${id}`,
      method: 'DELETE',
      success: () => {
        const updated = this.data.products.filter(p => p.product_id != id);
        this.setData({ products: updated });
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    });
  },
  chooseMedia(e) {
    const id = e.currentTarget.dataset.id;
  
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album','camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log('📥 选中的临时文件:', tempFilePath);
  
        wx.uploadFile({
          url: `${baseURL}/api/upload`,
          filePath: tempFilePath,
          name: 'file',
          formData: { product_id: id },
          success: (uploadRes) => {
            let data;
            try {
              data = JSON.parse(uploadRes.data);
            } catch (err) {
              console.error('❌ uploadRes.data 不是 JSON:', uploadRes.data);
              return wx.showToast({ title: '上传失败', icon: 'none' });
            }
  
            if (data.error) {
              console.error('❌ 后端返回错误:', data.error);
              return wx.showToast({ title: data.error, icon: 'none' });
            }
  
            const imageUrl = data.url;
            console.log('✅ 上传成功，imageUrl:', imageUrl);
  
            // 1) 前端更新这个商品的 image 字段
            const updated = this.data.products.map(p => {
              if (p.product_id == id) {
                return { ...p, image: imageUrl };
              }
              return p;
            });
            this.setData({ products: updated });
  
            wx.showToast({ title: '上传成功', icon: 'success' });
          },
          fail: (err) => {
            console.error('❌ wx.uploadFile 调用失败:', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '未选择图片', icon: 'none' });
      }
    });
  }
  
})  