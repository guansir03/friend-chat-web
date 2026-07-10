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
  messagesRef = query(ref(db, `rooms/${ROOM_ID}/messages`), limitToLast(100));
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
const typingEl = document.getElementById("typing");
const statusEl = document.getElementById("status");
const emojiBtn = document.getElementById("emojiBtn");
const imageInput = document.getElementById("imageInput");
const uploadProgress = document.getElementById("uploadProgress");

let myName = "";
let myAvatar = "🐱";
let notificationsEnabled = false;
let unreadCount = 0;
let originalTitle = document.title;
let isPageVisible = true;

const emojis = ["😀", "😂", "🥰", "😎", "😭", "😡", "👍", "❤️", "🎉", "🤔", "👀", "🙏"];
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

// 页面加载后，如果本地保存了身份，自动进入聊天室
tryAutoLogin();

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
  requestNotificationPermission();
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

// ===================== 6. 发送文字消息 =====================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !db) return;
  messageInput.value = "";

  push(ref(db, `rooms/${ROOM_ID}/messages`), {
    type: "text",
    text,
    sender: myName,
    avatar: myAvatar,
    timestamp: serverTimestamp(),
  }).catch((err) => {
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
  if (e.key === "Enter") sendMessage();
});

// ===================== 7. 发送图片 =====================
imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  await uploadImage(file);
  imageInput.value = "";
});

messageInput.addEventListener("paste", async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      if (file) await uploadImage(file);
      return;
    }
  }
});

async function uploadImage(file) {
  if (!file || !db) return;

  try {
    uploadProgress.textContent = "图片压缩中...";
    const dataUrl = await compressImage(file, 1280, 0.8);

    // base64 比原图大约 33%，RTDB 单节点建议控制在 1.5MB 以内
    if (dataUrl.length > 1.5 * 1024 * 1024) {
      uploadProgress.textContent = "图片压缩后仍太大，请选更小的图片。";
      return;
    }

    uploadProgress.textContent = "图片发送中...";
    await push(ref(db, `rooms/${ROOM_ID}/messages`), {
      type: "image",
      imageUrl: dataUrl,
      sender: myName,
      avatar: myAvatar,
      timestamp: serverTimestamp(),
    });

    uploadProgress.textContent = "";
  } catch (err) {
    console.error("图片发送失败", err);
    uploadProgress.textContent = "图片发送失败，请检查网络。";
  }
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

// ===================== 8. 接收消息 =====================
function listenMessages() {
  if (!messagesRef) return;

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const isMine = data.sender === myName && data.avatar === myAvatar;
    appendMessage(data, isMine);

    if (!isMine) {
      playMessageSound();
      if (!isPageVisible) {
        unreadCount++;
        updateTitle();
        const notifyBody = data.type === "image" ? "[图片]" : data.text || "新消息";
        showNotification(data.sender || "朋友", notifyBody);
      }
    }
  });

  const typingRef = query(ref(db, `rooms/${ROOM_ID}/typing`), limitToLast(1));
  onChildAdded(typingRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.sender !== myName) {
      statusEl.textContent = `${data.sender} 正在输入...`;
      typingEl.hidden = false;
      scrollToBottom();
      setTimeout(() => {
        statusEl.textContent = "在线";
        typingEl.hidden = true;
      }, 2000);
    }
  });
}

// ===================== 9. UI 渲染 =====================
function appendMessage(data, isMine) {
  const row = document.createElement("div");
  row.className = `message-row ${isMine ? "mine" : "theirs"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = data.avatar || "🧸";

  const msg = document.createElement("div");
  msg.className = `message ${isMine ? "mine" : "theirs"}`;

  const sender = document.createElement("div");
  sender.className = "sender";
  sender.textContent = data.sender || "朋友";

  const content = document.createElement("div");
  content.className = "content";

  if (data.type === "image" && data.imageUrl) {
    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = "图片";
    img.loading = "lazy";
    img.addEventListener("click", () => window.open(data.imageUrl, "_blank"));
    content.appendChild(img);
  } else {
    content.textContent = data.text || "";
  }

  const time = document.createElement("time");
  time.textContent = data.timestamp ? formatTime(new Date(data.timestamp)) : formatTime(new Date());

  msg.appendChild(sender);
  msg.appendChild(content);
  msg.appendChild(time);

  row.appendChild(avatar);
  row.appendChild(msg);
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
  chatMain.scrollTo({ top: chatMain.scrollHeight, behavior: "smooth" });
}

// ===================== 10. 通知与标题 =====================
async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    notificationsEnabled = true;
    notifyBtn.classList.add("enabled");
    notifyBtn.title = "消息通知已开启";
  } else {
    notifyBtn.title = "通知权限被拒绝";
  }
}

notifyBtn.addEventListener("click", requestNotificationPermission);

function showNotification(title, body) {
  if (!notificationsEnabled || isPageVisible) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
      badge: "https://cdn-icons-png.flaticon.com/512/2950/2950656.png",
      tag: "friend-chat-message",
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
  emojiPanel.style.cssText = `
    position: absolute;
    bottom: 78px;
    left: 18px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    padding: 10px;
    background: rgba(0,0,0,0.35);
    border-radius: 14px;
    backdrop-filter: blur(10px);
    z-index: 10;
  `;
  emojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.style.cssText = "background:transparent;border:none;font-size:22px;cursor:pointer;padding:4px;border-radius:8px;";
    btn.onmouseenter = () => (btn.style.background = "rgba(255,255,255,0.15)");
    btn.onmouseleave = () => (btn.style.background = "transparent");
    btn.addEventListener("click", () => {
      messageInput.value += emoji;
      messageInput.focus();
      emojiPanel.remove();
      emojiPanel = null;
    });
    emojiPanel.appendChild(btn);
  });
  document.querySelector(".chat-footer").appendChild(emojiPanel);
});

document.addEventListener("click", (e) => {
  if (emojiPanel && !emojiPanel.contains(e.target) && e.target.id !== "emojiBtn") {
    emojiPanel.remove();
    emojiPanel = null;
  }
});
