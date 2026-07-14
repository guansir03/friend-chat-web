import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  serverTimestamp,
  query,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ===================== 1. Firebase 配置 =====================
const firebaseConfig = {
  apiKey: "AIzaSyAYUMg9oxmP05bcowL-Vi9dFdDqd87ePLQ",
  authDomain: "friend-chat-web-c40cf.firebaseapp.com",
  databaseURL: "https://friend-chat-web-c40cf-default-rtdb.firebaseio.com",
  projectId: "friend-chat-web-c40cf",
  storageBucket: "friend-chat-web-c40cf.firebasestorage.app",
  messagingSenderId: "306817136268",
  appId: "1:306817136268:web:cc04578d785193c8e5ada9",
};

const ROOM_ID = "friend-chat-room";

// ===================== 2. 初始化 =====================
let app;
let db;
let messagesRef;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  messagesRef = query(ref(db, `rooms/${ROOM_ID}/messages`), limitToLast(500));
} catch (e) {
  console.error("Firebase 初始化失败，请检查 firebaseConfig", e);
}

// ===================== 3. DOM 元素 =====================
const setupEl = document.getElementById("setup");
const chatEl = document.getElementById("chat");
const nameInput = document.getElementById("nameInput");
const avatarInput = document.getElementById("avatarInput");
const avatarPicker = document.getElementById("avatarPicker");
const startBtn = document.getElementById("startBtn");
const setupHint = document.getElementById("setupHint");

const messagesEl = document.getElementById("messages");
const chatMain = document.getElementById("chatMain");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const notifyBtn = document.getElementById("notifyBtn");
const noticeBanner = document.getElementById("noticeBanner");
const enableNotifyBtn = document.getElementById("enableNotifyBtn");
const typingEl = document.getElementById("typing");
const emojiBtn = document.getElementById("emojiBtn");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const removePreview = document.getElementById("removePreview");
const uploadProgress = document.getElementById("uploadProgress");
const testNotifyBtn = document.getElementById("testNotifyBtn");
const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const historyPanelClose = document.getElementById("historyPanelClose");
const historyPanelBackdrop = document.querySelector(".history-panel-backdrop");
const historyList = document.getElementById("historyList");
const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
const imageModalClose = document.getElementById("imageModalClose");
const imageModalBackdrop = document.querySelector(".image-modal-backdrop");

let myName = "";
let myAvatar = "🐱";
let notificationsEnabled = false;
let unreadCount = 0;
let originalTitle = document.title;
let isPageVisible = true;
let pendingImage = null; // 待发送的图片 dataUrl
let messageHistory = []; // 用于历史记录展示

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉",
  "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪",
  "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟",
  "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
  "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮",
  "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷",
  "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀",
  "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
  "😿", "😾",
  "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈",
  "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌",
  "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🫶",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💓",
  "💞", "💕", "❣️", "💔", "💘", "💝", "💟", "♈", "♉", "♊", "♋", "♌",
  "♍", "♎", "♏", "♐", "♑", "♒", "♓",
  "🎉", "🎊", "🎈", "🎂", "🎁", "🎄", "🎃", "🧨", "✨", "🌟", "💫", "⭐",
  "🌈", "🔥", "💥", "💯", "💢", "💦", "💧", "🌊"
];

const superEmojis = [
  { emoji: "😂", codepoint: "1f602", name: "笑哭" },
  { emoji: "😭", codepoint: "1f62d", name: "大哭" },
  { emoji: "😍", codepoint: "1f60d", name: "花痴" },
  { emoji: "🥰", codepoint: "1f970", name: "爱心脸" },
  { emoji: "😘", codepoint: "1f618", name: "飞吻" },
  { emoji: "🤣", codepoint: "1f923", name: "打滚笑" },
  { emoji: "😎", codepoint: "1f60e", name: "酷" },
  { emoji: "🥳", codepoint: "1f973", name: "派对" },
  { emoji: "😡", codepoint: "1f621", name: "生气" },
  { emoji: "🤯", codepoint: "1f92f", name: "爆炸头" },
  { emoji: "🥺", codepoint: "1f97a", name: "可怜" },
  { emoji: "🤩", codepoint: "1f929", name: "星星眼" },
  { emoji: "😱", codepoint: "1f631", name: "惊吓" },
  { emoji: "😴", codepoint: "1f634", name: "睡觉" },
  { emoji: "🤮", codepoint: "1f92e", name: "呕吐" },
  { emoji: "🤡", codepoint: "1f921", name: "小丑" },
  { emoji: "💩", codepoint: "1f4a9", name: "便便" },
  { emoji: "👻", codepoint: "1f47b", name: "幽灵" },
  { emoji: "❤️", codepoint: "2764", name: "红心" },
  { emoji: "🔥", codepoint: "1f525", name: "火" },
  { emoji: "🎉", codepoint: "1f389", name: "庆祝" },
  { emoji: "👍", codepoint: "1f44d", name: "赞" },
  { emoji: "🙏", codepoint: "1f64f", name: "祈祷" },
  { emoji: "🎃", codepoint: "1f383", name: "南瓜" }
];

const avatars = ["🐱", "🐶", "🦊", "🐼", "🐨", "🐯", "🐰", "🐸", "🐙", "🦄", "🐲", "👽"];
const IDENTITY_KEY = "friend-chat-identity";

// ===================== 4. 头像选择器 =====================
avatars.forEach((a) => {
  const btn = document.createElement("div");
  btn.className = "avatar-option";
  btn.textContent = a;
  if (a === myAvatar) btn.classList.add("selected");
  btn.addEventListener("click", () => {
    avatarPicker.querySelectorAll(".avatar-option").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    avatarInput.value = a;
  });
  avatarPicker.appendChild(btn);
});

// ===================== 5. 进入聊天室 =====================
startBtn.addEventListener("click", enterChat);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enterChat();
});

function enterChat() {
  const name = nameInput.value.trim();
  if (!name) {
    setupHint.textContent = "请输入昵称后再进入。";
    return;
  }
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
    setupHint.innerHTML =
      '请先按 README 配置 Firebase，再替换 <code>script.js</code> 里的 firebaseConfig。';
    return;
  }
  myName = name;
  myAvatar = avatarInput.value || "🐱";
  saveIdentity(myName, myAvatar);

  setupEl.hidden = true;
  chatEl.hidden = false;
  document.getElementById("chatTitle").textContent = myName;
  document.getElementById("friendAvatar").textContent = myAvatar;
  messageInput.focus();
  listenMessages();
  setupNotifications();
}

function saveIdentity(name, avatar) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name, avatar }));
  } catch (e) {
    console.warn("保存身份信息失败", e);
  }
}

function loadIdentity() {
  try {
    const data = localStorage.getItem(IDENTITY_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn("读取身份信息失败", e);
    return null;
  }
}

function tryAutoLogin() {
  const saved = loadIdentity();
  if (!saved || !saved.name) return;
  nameInput.value = saved.name;
  avatarInput.value = saved.avatar;
  avatarPicker.querySelectorAll(".avatar-option").forEach((b) => {
    b.classList.toggle("selected", b.textContent === saved.avatar);
  });
  enterChat();
}

tryAutoLogin();

// ===================== 6. 通知 =====================
async function setupNotifications() {
  if (!("Notification" in window)) return;
  const permission = await Notification.requestPermission();
  updateNotifyState(permission === "granted");
  if (permission !== "granted") {
    noticeBanner.hidden = false;
  }
}

function updateNotifyState(enabled) {
  notificationsEnabled = enabled;
  if (enabled) {
    notifyBtn.classList.add("enabled");
    notifyBtn.title = "消息通知已开启";
    noticeBanner.hidden = true;
    testNotifyBtn.hidden = false;
  } else {
    notifyBtn.classList.remove("enabled");
    notifyBtn.title = "点击开启消息通知";
    testNotifyBtn.hidden = true;
  }
}

notifyBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  const permission = await Notification.requestPermission();
  updateNotifyState(permission === "granted");
});

enableNotifyBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  const permission = await Notification.requestPermission();
  updateNotifyState(permission === "granted");
});

testNotifyBtn.addEventListener("click", () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    alert("通知权限未开启，请先点击顶部 🔔 开启。");
    return;
  }
  new Notification("测试通知", {
    body: "如果你看到这条系统弹窗，说明通知功能正常。",
    icon: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
    badge: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
    tag: "friend-chat-test",
    requireInteraction: false,
  });
});

// 图片预览弹窗
function openImageModal(url) {
  imageModalImg.src = url;
  imageModal.hidden = false;
}

function closeImageModal() {
  imageModal.hidden = true;
  imageModalImg.src = "";
}

imageModalClose.addEventListener("click", closeImageModal);
imageModalBackdrop.addEventListener("click", closeImageModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !imageModal.hidden) {
    closeImageModal();
  }
});

// ===================== 历史记录面板 =====================
historyBtn.addEventListener("click", openHistoryPanel);
historyPanelClose.addEventListener("click", closeHistoryPanel);
historyPanelBackdrop.addEventListener("click", closeHistoryPanel);

function openHistoryPanel() {
  historyPanel.hidden = false;
  loadHistory();
}

function closeHistoryPanel() {
  historyPanel.hidden = true;
}

function loadHistory() {
  if (messageHistory.length === 0) {
    historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
    return;
  }
  renderHistory(messageHistory);
}

function renderHistory(messages) {
  historyList.innerHTML = "";
  let lastDate = "";

  messages.forEach((msg) => {
    const date = msg.timestamp ? formatDate(new Date(msg.timestamp)) : "未知日期";
    if (date !== lastDate) {
      const dateDiv = document.createElement("div");
      dateDiv.className = "history-date";
      dateDiv.textContent = date;
      historyList.appendChild(dateDiv);
      lastDate = date;
    }

    const item = document.createElement("div");
    item.className = "history-item";

    const avatar = document.createElement("div");
    avatar.className = "history-item-avatar";
    avatar.textContent = msg.avatar || "🧸";

    const body = document.createElement("div");
    body.className = "history-item-body";

    const sender = document.createElement("div");
    sender.className = "history-item-sender";
    const time = msg.timestamp ? formatTime(new Date(msg.timestamp)) : "";

    const senderName = document.createElement("span");
    senderName.textContent = msg.sender || "朋友";
    sender.appendChild(senderName);

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-item-time";
    timeSpan.textContent = time;
    sender.appendChild(timeSpan);

    if (msg.type === "sticker" && msg.codepoint) {
      const stickerDiv = document.createElement("div");
      stickerDiv.className = "history-item-sticker";
      stickerDiv.textContent = msg.emoji || "🧸";
      body.appendChild(stickerDiv);
    }

    if (msg.text) {
      const textDiv = document.createElement("div");
      textDiv.className = "history-item-text";
      textDiv.textContent = msg.text;
      body.appendChild(textDiv);
    }

    if (msg.imageUrl) {
      const img = document.createElement("img");
      img.src = msg.imageUrl;
      img.alt = "图片";
      img.addEventListener("click", () => openImageModal(msg.imageUrl));
      body.appendChild(img);
    }

    body.insertBefore(sender, body.firstChild);
    item.appendChild(avatar);
    item.appendChild(body);
    historyList.appendChild(item);
  });
}

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dStr = date.toLocaleDateString("zh-CN");
  if (dStr === today.toLocaleDateString("zh-CN")) return "今天";
  if (dStr === yesterday.toLocaleDateString("zh-CN")) return "昨天";
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

function showNotification(title, body) {
  if (!notificationsEnabled || isPageVisible) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
      badge: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
      tag: `friend-chat-message-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      requireInteraction: false,
    });
  } catch (e) {
    console.warn("通知显示失败", e);
  }
}

document.addEventListener("visibilitychange", () => {
  isPageVisible = !document.hidden;
  if (isPageVisible) {
    unreadCount = 0;
    updateTitle();
  }
});

function updateTitle() {
  document.title = unreadCount > 0 && !isPageVisible
    ? `(${unreadCount}) 新消息 - ${originalTitle}`
    : originalTitle;
}

// ===================== 7. 发送消息 =====================
function sendSticker(sticker) {
  if (!db) return;
  const payload = {
    type: "sticker",
    stickerType: "lottie",
    emoji: sticker.emoji,
    codepoint: sticker.codepoint,
    sender: myName,
    avatar: myAvatar,
    timestamp: serverTimestamp(),
  };
  push(ref(db, `rooms/${ROOM_ID}/messages`), payload).catch((err) => {
    console.error("发送失败", err);
    appendSystemMsg("表情发送失败，请检查网络或 Firebase 配置。");
  });
}

function sendMessage() {
  const text = messageInput.value.trim();
  if ((!text && !pendingImage) || !db) return;

  const payload = {
    sender: myName,
    avatar: myAvatar,
    timestamp: serverTimestamp(),
  };

  if (pendingImage && text) {
    payload.type = "mixed";
    payload.text = text;
    payload.imageUrl = pendingImage;
  } else if (pendingImage) {
    payload.type = "image";
    payload.imageUrl = pendingImage;
  } else {
    payload.type = "text";
    payload.text = text;
  }

  messageInput.value = "";
  clearPendingImage();

  push(ref(db, `rooms/${ROOM_ID}/messages`), payload).catch((err) => {
    console.error("发送失败", err);
    appendSystemMsg("消息发送失败，请检查网络或 Firebase 配置。");
  });

  push(ref(db, `rooms/${ROOM_ID}/typing`), {
    sender: myName,
    avatar: myAvatar,
    timestamp: serverTimestamp(),
  }).catch(() => {});
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ===================== 8. 图片处理 =====================
imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) await prepareImage(file);
  imageInput.value = "";
});

messageInput.addEventListener("paste", async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      if (file) await prepareImage(file);
      return;
    }
  }
});

removePreview.addEventListener("click", clearPendingImage);

async function prepareImage(file) {
  try {
    uploadProgress.textContent = "图片压缩中...";
    const dataUrl = await compressImage(file, 1280, 0.8);

    if (dataUrl.length > 1.5 * 1024 * 1024) {
      uploadProgress.textContent = "图片太大，压缩后仍超过限制。";
      return;
    }

    pendingImage = dataUrl;
    previewImg.src = dataUrl;
    imagePreview.hidden = false;
    uploadProgress.textContent = "";
    messageInput.focus();
  } catch (err) {
    console.error("图片处理失败", err);
    uploadProgress.textContent = "图片处理失败。";
  }
}

function clearPendingImage() {
  pendingImage = null;
  previewImg.src = "";
  imagePreview.hidden = true;
  uploadProgress.textContent = "";
}

function compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("图片读取失败"));
    img.src = url;
  });
}

// ===================== 9. 接收消息 =====================
function listenMessages() {
  if (!messagesRef) return;

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    messageHistory.push(data);

    const isMine = data.sender === myName && data.avatar === myAvatar;
    appendMessage(data, isMine);

    if (!isMine) {
      playMessageSound();
      if (!isPageVisible) {
        unreadCount++;
        updateTitle();
        let notifyBody = "新消息";
        if (data.type === "image") notifyBody = "[图片]";
        else if (data.type === "sticker") notifyBody = "[超级表情]";
        else if (data.text) notifyBody = data.text;
        showNotification(data.sender || "朋友", notifyBody);
      }
    }
  });

  const typingRef = query(ref(db, `rooms/${ROOM_ID}/typing`), limitToLast(1));
  onChildAdded(typingRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.sender !== myName) {
      typingEl.hidden = false;
      setTimeout(() => {
        typingEl.hidden = true;
      }, 2000);
    }
  });
}

// ===================== 10. UI 渲染 =====================
function appendMessage(data, isMine) {
  const row = document.createElement("div");
  row.className = `message-row ${isMine ? "mine" : "theirs"}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = data.avatar || "🧸";

  const body = document.createElement("div");
  body.className = "message-body";

  const sender = document.createElement("div");
  sender.className = "message-sender";
  sender.textContent = data.sender || "朋友";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (data.type === "sticker" && data.codepoint) {
    bubble.classList.add("sticker-bubble");
    const container = document.createElement("div");
    container.className = "message-sticker";
    if (window.lottie) {
      try {
        let loaded = false;
        const anim = window.lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: `https://fonts.gstatic.com/s/e/notoemoji/latest/${data.codepoint}/lottie.json`,
        });
        anim.addEventListener("data_ready", () => {
          loaded = true;
        });
        anim.addEventListener("error", () => {
          container.textContent = data.emoji || "🧸";
        });
        setTimeout(() => {
          if (!loaded) container.textContent = data.emoji || "🧸";
        }, 5000);
      } catch (e) {
        container.textContent = data.emoji || "🧸";
      }
    } else {
      container.textContent = data.emoji || "🧸";
    }
    bubble.appendChild(container);
  } else {
    if (data.text) {
      const textDiv = document.createElement("div");
      textDiv.className = "message-text";
      textDiv.textContent = data.text;
      bubble.appendChild(textDiv);
    }

    if (data.imageUrl) {
      const img = document.createElement("img");
      img.className = "message-image";
      img.src = data.imageUrl;
      img.alt = "图片";
      img.loading = "lazy";
      img.addEventListener("click", () => openImageModal(data.imageUrl));
      bubble.appendChild(img);
    }
  }

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = data.timestamp ? formatTime(new Date(data.timestamp)) : formatTime(new Date());

  body.appendChild(sender);
  body.appendChild(bubble);
  body.appendChild(time);

  row.appendChild(avatar);
  row.appendChild(body);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function appendSystemMsg(text) {
  const div = document.createElement("div");
  div.className = "system-msg";
  div.textContent = text;
  messagesEl.appendChild(div);
  scrollToBottom();
}

function formatTime(date) {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
  chatMain.scrollTop = chatMain.scrollHeight;
}

// ===================== 11. 提示音 =====================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playMessageSound() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

// ===================== 12. 表情面板 =====================
let emojiPanel = null;
emojiBtn.addEventListener("click", () => {
  if (emojiPanel) {
    emojiPanel.remove();
    emojiPanel = null;
    return;
  }
  emojiPanel = document.createElement("div");
  emojiPanel.className = "emoji-panel";

  const tabs = document.createElement("div");
  tabs.className = "emoji-tabs";

  const normalTab = document.createElement("button");
  normalTab.className = "emoji-tab active";
  normalTab.textContent = "😊 表情";

  const superTab = document.createElement("button");
  superTab.className = "emoji-tab";
  superTab.textContent = "✨ 超级表情";

  tabs.appendChild(normalTab);
  tabs.appendChild(superTab);
  emojiPanel.appendChild(tabs);

  const content = document.createElement("div");
  content.className = "emoji-content normal-emojis";
  emojiPanel.appendChild(content);

  function renderNormalEmojis() {
    content.className = "emoji-content normal-emojis";
    content.innerHTML = "";
    emojis.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.textContent = emoji;
      btn.title = emoji;
      btn.addEventListener("click", () => {
        messageInput.value += emoji;
        messageInput.focus();
        emojiPanel.remove();
        emojiPanel = null;
      });
      content.appendChild(btn);
    });
  }

  function renderSuperEmojis() {
    content.className = "emoji-content super-emojis";
    content.innerHTML = "";
    superEmojis.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "super-emoji-btn";
      btn.textContent = item.emoji;
      btn.title = item.name;
      btn.addEventListener("click", () => {
        sendSticker(item);
        emojiPanel.remove();
        emojiPanel = null;
      });
      content.appendChild(btn);
    });
  }

  normalTab.addEventListener("click", () => {
    normalTab.classList.add("active");
    superTab.classList.remove("active");
    renderNormalEmojis();
  });

  superTab.addEventListener("click", () => {
    superTab.classList.add("active");
    normalTab.classList.remove("active");
    renderSuperEmojis();
  });

  renderNormalEmojis();
  document.body.appendChild(emojiPanel);
  positionEmojiPanel();
});

function positionEmojiPanel() {
  if (!emojiPanel) return;
  const rect = emojiBtn.getBoundingClientRect();
  const panelWidth = emojiPanel.offsetWidth || 320;
  const panelHeight = emojiPanel.offsetHeight || 320;
  let left = rect.left;
  let top = rect.top - panelHeight - 10;

  if (left + panelWidth > window.innerWidth - 10) {
    left = window.innerWidth - panelWidth - 10;
  }
  if (left < 10) left = 10;
  if (top < 10) top = rect.bottom + 10;

  emojiPanel.style.left = `${left}px`;
  emojiPanel.style.top = `${top}px`;
}

document.addEventListener("click", (e) => {
  if (emojiPanel && !emojiPanel.contains(e.target) && e.target.id !== "emojiBtn") {
    emojiPanel.remove();
    emojiPanel = null;
  }
});

window.addEventListener("resize", positionEmojiPanel);
