const app = getApp();

const API_BASE = 'http://10.7.81.244:8081/api';

// 后端 GET /api/posts 直接返回 Post[] 数组
// 后端不返回 liked 字段，前端从 app.globalData.likedPostIds 读取并补充
function enrichPost(p) {
  return { ...p, liked: app.isLiked(p.id) };
}

Page({
  data: {
    posts: [],
    userInfo: null
  },

  onLoad() {
    this.loadPosts();
  },

  onShow() {
    this.loadPosts();
  },

  getCurrentUser() {
    return {
      avatar: '😊',
      nickName: '我'
    };
  },

  // 加载动态列表 - GET /api/posts
  loadPosts() {
    wx.showNavigationBarLoading();
    wx.request({
      url: `${API_BASE}/posts`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.setData({
            posts: (res.data || []).map(enrichPost),
            userInfo: this.getCurrentUser()
          });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideNavigationBarLoading();
      }
    });
  },

  // 点赞 / 取消点赞 - POST 或 DELETE /api/posts/{id}/like
  onLike(e) {
    const id = e.currentTarget.dataset.id;
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return;

    const willLike = !post.liked;
    const method = willLike ? 'POST' : 'DELETE';

    // 先本地切换 liked 状态，保证 UI 即时响应
    app.toggleLikeLocal(id);
    this.setData({
      posts: this.data.posts.map(p =>
        p.id === id
          ? { ...p, liked: willLike, likesCount: p.likesCount + (willLike ? 1 : -1) }
          : p
      )
    });

    wx.request({
      url: `${API_BASE}/posts/${id}/like`,
      method,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 拉一次最新数据，likesCount 以服务端为准
          this.loadPosts();
        } else {
          // 回滚
          app.toggleLikeLocal(id);
          this.setData({
            posts: this.data.posts.map(p =>
              p.id === id
                ? { ...p, liked: !willLike, likesCount: p.likesCount + (willLike ? -1 : 1) }
                : p
            )
          });
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        // 回滚
        app.toggleLikeLocal(id);
        this.setData({
          posts: this.data.posts.map(p =>
            p.id === id
              ? { ...p, liked: !willLike, likesCount: p.likesCount + (willLike ? -1 : 1) }
              : p
          )
        });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 点击图片预览
  onPreviewImage(e) {
    const { index, images } = e.currentTarget.dataset;
    wx.showToast({ title: `查看第 ${index + 1} 张图`, icon: 'none' });
  },

  // 进入详情
  onPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    });
  },

  // 去发布
  onPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  }
});
