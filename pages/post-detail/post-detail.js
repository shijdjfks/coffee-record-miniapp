const app = getApp();

const API_BASE = 'http://10.7.81.244:8081/api';

// 后端不返回 liked 字段，前端从 app.globalData.likedPostIds 补充
function enrichPost(p) {
  return { ...p, liked: app.isLiked(p.id) };
}

// 后端评论对象只返回 { id, postId, userId, text, createdAt }
// nickname / avatar 前端用 userId 兜底渲染（userId=1 即"我"）
function enrichComment(c) {
  const isMe = String(c.userId) === String(app.globalData.userId);
  return {
    ...c,
    nickname: isMe ? '我' : `用户${c.userId}`,
    avatar: isMe ? '😊' : '👤'
  };
}

Page({
  data: {
    postId: null,
    post: null,
    comments: [],      // 独立的评论列表
    commentText: ''
  },

  onLoad(options) {
    this.setData({ postId: options.id });
  },

  onShow() {
    this.loadPost();
    this.loadComments();
  },

  // 加载动态详情 - GET /api/posts/{id}
  loadPost() {
    if (!this.data.postId) return;
    wx.request({
      url: `${API_BASE}/posts/${this.data.postId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data) {
            this.setData({ post: enrichPost(res.data) });
          } else {
            wx.showToast({ title: '动态不存在', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 1000);
          }
        } else if (res.statusCode === 404) {
          wx.showToast({ title: '动态不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 加载评论列表 - GET /api/posts/{id}/comments
  loadComments() {
    if (!this.data.postId) return;
    wx.request({
      url: `${API_BASE}/posts/${this.data.postId}/comments`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const list = (res.data || []).map(enrichComment);
          this.setData({
            comments: list,
            // 同步 post.comments / post.commentsCount 供 WXML 已有的绑定使用
            'post.comments': list,
            'post.commentsCount': list.length
          });
        } else {
          wx.showToast({ title: '评论加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 点赞 / 取消点赞 - POST 或 DELETE /api/posts/{id}/like
  onLike() {
    const post = this.data.post;
    if (!post) return;
    const willLike = !post.liked;
    const method = willLike ? 'POST' : 'DELETE';

    app.toggleLikeLocal(this.data.postId);
    this.setData({
      post: { ...post, liked: willLike, likesCount: post.likesCount + (willLike ? 1 : -1) }
    });

    wx.request({
      url: `${API_BASE}/posts/${this.data.postId}/like`,
      method,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.loadPost();
        } else {
          app.toggleLikeLocal(this.data.postId);
          this.setData({
            post: { ...this.data.post, liked: !willLike, likesCount: this.data.post.likesCount + (willLike ? -1 : 1) }
          });
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        app.toggleLikeLocal(this.data.postId);
        this.setData({
          post: { ...this.data.post, liked: !willLike, likesCount: this.data.post.likesCount + (willLike ? -1 : 1) }
        });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 发送评论 - POST /api/posts/{id}/comments
  // 请求体：{ text }
  // 成功后调用 loadComments() 刷新列表
  onSendComment() {
    const text = this.data.commentText.trim();
    if (!text) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    wx.request({
      url: `${API_BASE}/posts/${this.data.postId}/comments`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { text },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          this.setData({ commentText: '' });
          // ★ 关键：发表评论成功后调用 loadComments 刷新列表
          this.loadComments();
          wx.showToast({ title: '评论成功', icon: 'success' });
        } else {
          wx.showToast({ title: '评论失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
