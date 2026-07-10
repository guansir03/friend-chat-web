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

// ===================== 1. 替换为你的 Firebase 配置 =====================
const firebaseConfig = {
  apiKey: "AIzaSyAYUMg9oxmP05bcowL-Vi9dFdDqd87ePLQ",
  authDomain: "friend-chat-web-c40cf.firebaseapp.com",
  databaseURL: "https://friend-chat-web-c40cf-default-rtdb.firebaseio.com",
  projectId: "friend-chat-web-c40cf",
  storageBucket: "friend-chat-web-c40cf.firebasestorage.app",
  messagingSenderId: "306817136268",
  appId: "1:306817136268:web:cc04578d785193c8e5ada9",
};

const ROOM_ID = "friend-chat-room"; // 你和朋友的房间号，可改

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

let myName = "";
let notificationsEnabled = false;
let unreadCount = 0;
let originalTitle = document.title;
let isPageVisible = true;
let lastTypingSent = 0;

const emojis = ["😀", "😂", "🥰", "😎", "😭", "😡", "👍", "❤️", "🎉", "🤔", "👀", "🙏"];

// ===================== 4. 进入聊天室 =====================
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
  setupEl.hidden = true;
  chatEl.hidden = false;
  messageInput.focus();
  listenMessages();
  requestNotificationPermission();
}

// ===================== 5. 发送消息 =====================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !db) return;
  messageInput.value = "";

  push(ref(db, `rooms/${ROOM_ID}/messages`), {
    text,
    sender: myName,
    timestamp: serverTimestamp(),
  }).catch((err) => {
    console.error("发送失败", err);
    appendSystemMsg("消息发送失败，请检查网络或 Firebase 配置。");
  });

  // 简单的“正在输入”信号
  push(ref(db, `rooms/${ROOM_ID}/typing`), {
    sender: myName,
    timestamp: serverTimestamp(),
  }).catch(() => {});
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ===================== 6. 接收消息 =====================
function listenMessages() {
  if (!messagesRef) return;

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const isMine = data.sender === myName;
    appendMessage(data.text, data.sender, isMine, data.timestamp);

    if (!isMine) {
      playMessageSound();
      if (!isPageVisible) {
        unreadCount++;
        updateTitle();
        showNotification(data.sender || "朋友", data.text);
      }
    }
  });

  // 监听“正在输入”
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

// ===================== 7. UI 渲染 =====================
function appendMessage(text, sender, isMine, ts) {
  const msg = document.createElement("div");
  msg.className = `message ${isMine ? "mine" : "theirs"}`;
  const timeStr = ts ? formatTime(new Date(ts)) : formatTime(new Date());
  const senderHtml = isMine ? "" : `<div class="sender">${escapeHtml(sender || "朋友")}</div>`;
  msg.innerHTML = `${senderHtml}<div>${escapeHtml(text)}</div><time>${timeStr}</time>`;
  messagesEl.appendChild(msg);
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  chatMain.scrollTo({ top: chatMain.scrollHeight, behavior: "smooth" });
}

// ===================== 8. 通知与标题 =====================
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

// ===================== 9. 提示音 =====================
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

// ===================== 10. 表情面板 =====================
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
