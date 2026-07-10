# Friend Chat 💬

一个可直接部署在 **GitHub Pages** 上的私人聊天网页，支持朋友间实时消息、桌面通知和提示音。

## 功能

- 💅 现代玻璃拟态 UI，适配桌面与移动端
- 💬 基于 Firebase Realtime Database 的**真实实时聊天**
- 🔔 浏览器/系统桌面通知
- 🔊 新消息提示音
- 😊 表情选择器
- 📱 标签页未读消息计数
- 👤 进入时输入昵称，区分自己和对方

## 快速开始

### 1. 创建 Firebase 项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)。
2. 点击“创建项目”，输入项目名（例如 `friend-chat-web`）。
3. 进入项目后，点击左侧 ⚙️ → **项目设置** → **应用** → **</>** 添加 Web 应用。
4. 注册应用后，复制 Firebase 提供的 `firebaseConfig` 对象。
5. 进入左侧 **Realtime Database** → **创建数据库** → 选择地区 → **测试模式**（公开读写，适合 Demo）。
6. 记下数据库 URL，类似 `https://friend-chat-web-default-rtdb.firebaseio.com`。

### 2. 替换配置

编辑 `script.js`，把开头的 `firebaseConfig` 替换为你刚才复制的配置：

```js
const firebaseConfig = {
  apiKey: "你的 apiKey",
  authDomain: "你的 authDomain",
  databaseURL: "你的 databaseURL",
  projectId: "你的 projectId",
  storageBucket: "你的 storageBucket",
  messagingSenderId: "你的 messagingSenderId",
  appId: "你的 appId",
};
```

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
