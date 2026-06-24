App({
  onLaunch() {
    this.globalData = {
      // 当前登录用户（开发阶段固定 userId=1）
      userId: '1',
      // 当前用户已点赞的动态 id 列表
      // 后端不返回 liked 字段，由前端自己维护并写入 storage
      likedPostIds: wx.getStorageSync('likedPostIds') || []
    };
  },

  // 切换本地 liked 状态（不调用后端，仅维护状态）
  toggleLikeLocal(postId) {
    const ids = this.globalData.likedPostIds;
    const idx = ids.indexOf(postId);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(postId);
    }
    wx.setStorageSync('likedPostIds', ids);
    return idx < 0; // 返回切换后的状态：true=已点赞
  },

  // 读取 liked 状态
  isLiked(postId) {
    return this.globalData.likedPostIds.indexOf(postId) >= 0;
  }
});
