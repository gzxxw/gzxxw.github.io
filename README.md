# Lim 个人站

米白底杂志风 · GitHub Pages 托管 · Supabase 留言

## 文件结构
```
lim-website/
├── index.html      # 主页（六区块）
├── css/style.css   # 样式
├── js/main.js      # 特效 + 留言逻辑
└── assets/         # 素材（logo 等）
```

## 🚀 部署三步走

### 1. 上传到 GitHub
1. 打开 https://github.com 登录（你应该有号，毕竟旧站都是 GitHub Pages）
2. 新建仓库，名字必须是 **`gzxxw.github.io`**（你的用户名是 gzxxw 对吧？就是你现在占位页那个仓库名，直接用它）
3. 把 `index.html`、`css/`、`js/` 传进仓库根目录（别放子文件夹！）

### 2. 开 GitHub Pages
- 仓库 Settings → Pages → Source 选 `main` 分支 → Save
- 等 1~2 分钟，`https://gzxxw.github.io` 就是新站了

### 3. 配 Supabase 留言（js/main.js 顶部有注释，照抄）
1. 去 https://supabase.com 注册，免费建项目
2. SQL Editor 跑建表语句 + 两条放行策略（文件里注释抄好了，直接复制）
3. 把 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 填进 `js/main.js`
4. 后台 Tables → messages 里把新留言 status 改成 `approved` 才会显示

## 🛡️ 留言过滤（已内置）
- 敏感词拦截：代开发/加微信/兼职/博彩/贷款/广告等
- 链接拦截：http、www 开头的广告党直接拒
- 频率限制：60 秒最多 3 条
- 人工兜底：Supabase 后台手动审核，垃圾留言改 status 为 blocked 就行

## 🔧 想改内容？直接开文件改文字
- 自我介绍 → `index.html` 里 `.hero-desc`
- 作品卡 → `.card` 三处（标题/描述/标签）
- 爱好 → `.hobby-list`
- 邮箱 → 页脚 `mailto:`

改完 push 上去，GitHub Pages 自动更新，别的啥都不用动。

二期计划：AI 卡通头像 🏀
