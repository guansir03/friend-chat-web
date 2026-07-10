# Friend Chat 💬

一个可直接部署在 **GitHub Pages** 上的私人聊天网页，支持多人实时消息、头像、图片发送、桌面通知和提示音。

## 功能

- 💅 现代玻璃拟态 UI，适配桌面与移动端
- 👤 进入时选择头像 + 输入昵称
- 💬 基于 Firebase Realtime Database 的**多人实时聊天**
- 🖼️ 发送图片（压缩后以 base64 存入 Realtime Database，无需额外 Storage）
- 🔔 浏览器/系统桌面通知
- 🔊 新消息提示音
- 😊 表情选择器
- 📱 标签页未读消息计数

## 聊天室人数

Firebase Spark（免费版）Realtime Database 默认支持最多 **10 万同时在线连接**，数据流量和存储有免费额度。对于朋友间小范围聊天，人数基本没有实际限制。如果未来用户量变大，可以考虑升级到 Firebase Blaze 付费计划。

## 快速开始

### 1. 创建 Firebase 项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)。
2. 点击“创建项目”，输入项目名（例如 `friend-chat-web`）。
3. 进入项目后，点击左侧 ⚙️ → **项目设置** → **应用** → **</>** 添加 Web 应用。
4. 注册应用后，复制 Firebase 提供的 `firebaseConfig` 对象。
5. 进入左侧 **Realtime Database** → **创建数据库** → 选择地区 → **测试模式**（公开读写，适合 Demo）。

> 图片会直接以压缩后的 base64 形式存入 Realtime Database，不需要额外开启 Firebase Storage。

### 2. 替换配置

编辑 `script.js`，把开头的 `firebaseConfig` 替换为你刚才复制的配置。

### 3. 本地预览

```bash
py -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

> 注意：Notification API 需要安全上下文（`https://` 或 `localhost`），本地预览可正常工作。

### 4. 部署到 GitHub Pages

1. 在 GitHub 新建仓库，把这些文件推上去。
2. 进入仓库 **Settings → Pages**。
3. Source 选择 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`。
4. 保存后访问 `https://<你的用户名>.github.io/<仓库名>/`。

## 安全提示

- Demo 使用 Firebase 的“测试模式”（公开读写），仅适合熟人小范围使用。
- 如需更高安全性，可启用 Firebase Authentication 并配置数据库安全规则。

## 文件结构

```
.
├── index.html    # 页面结构
├── style.css     # 样式
├── script.js     # Firebase 实时聊天逻辑
└── README.md     # 本说明
```
