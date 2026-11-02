/* ============================================================
   Lim · 特效 + 留言交互（Gist 驱动版）

   留言板改为使用 GitHub Gist Comments API：
   - Gist: https://gist.github.com/gzxxw/52aae8bdc4e32cd3086952349545e75c
   - 读取: GET /gists/{id}/comments （公开，无需任何鉴权）
   - 写入: 跳转 Gist 页面用 GitHub 账号评论（最安全，不暴露 token）

   ⚠️ 若你想在站内直接发评论（POST /gists/{id}/comments），
      需要把 GIST_TOKEN 填成你的 GitHub token。
      但注意：token 放在前端 JS 里会被所有访客看到，
      而且 GitHub 的 secret scanning 很可能直接吊销它，
      强烈不推荐。默认请保持 null。
   ============================================================ */
var GIST_ID = "52aae8bdc4e32cd3086952349545e75c";
var GIST_TOKEN = null; // ⚠️ 强烈建议保持 null，让访客去 Gist 页面用自己的账号评论

/* ---------- ① 动效：AOS 滚动出现 + Typed.js 打字机 + Animate.css hover ---------- */
(function initEffects() {
  if (window.AOS) {
    AOS.init({
      once: true,      // 只播一次，滚动回来不重播，省性能
      duration: 600,
      offset: 80,
      easing: "ease-out-cubic"
    });
  }

  if (window.Typed && document.getElementById("typed")) {
    new Typed("#typed", {
      strings: [
        "「原神」提瓦特观光团 · UID 277743783",
        "「崩坏：星穹铁道」开拓者 · UID 117119074",
        "折腾 AI，让 AI 干活而不是被 AI 干",
        "写点小工具，顺便解决自己的问题",
        "白天刷题，晚上搞机，偶尔登登游戏"
      ],
      typeSpeed: 55,
      backSpeed: 26,
      backDelay: 1700,
      startDelay: 400,
      loop: true,
      smartBackspace: false
    });
  }

  // hover 小动画：Animate.css 在鼠标移入时触发一次，播完自动摘类
  function bindHoverAnim(selector, anim, iconSel) {
    document.querySelectorAll(selector).forEach(function (el) {
      var icon = el.querySelector(iconSel);
      if (!icon) return;
      el.addEventListener("mouseenter", function () {
        icon.classList.add("animate__animated", anim);
        icon.addEventListener("animationend", function done() {
          icon.classList.remove("animate__animated", anim);
          icon.removeEventListener("animationend", done);
        });
      });
    });
  }
  bindHoverAnim(".card", "animate__rubberBand", ".card-icon i");
  bindHoverAnim(".hobby-list li", "animate__heartBeat", ".hobby-ico i");
})();

/* ---------- ② 留言渲染（Gist Comments API） ---------- */
var listEl = document.getElementById("guestbook-list");
var statusEl = document.getElementById("gb-status");

function esc(s) {
  // 只转义 & < > 即可（渲染进文本节点，双引号无需处理）
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 把 Gist 评论的 Markdown 正文转成纯文本（去掉标题/列表符号/代码围栏等）
function mdToText(md) {
  return String(md || "")
    .replace(/```[\s\S]*?```/g, " ")   // 代码块
    .replace(/`([^`]*)`/g, "$1")         // 行内代码
    .replace(/^#{1,6}\s+/gm, "")        // 标题
    .replace(/^[>\s]*>\s?/gm, "")       // 引用
    .replace(/^[-*+]\s+/gm, "")         // 无序列表
    .replace(/^\d+\.\s+/gm, "")        // 有序列表
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")    // 图片
    .replace(/\*\*([^*]*)\*\*/g, "$1") // 粗体
    .replace(/\*([^*]*)\*/g, "$1")      // 斜体
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderMessages(rows) {
  if (!rows || rows.length === 0) {
    listEl.innerHTML = '<p class="gb-empty"><i class="icon-couch gb-ico" aria-hidden="true"></i>还没有留言，沙发等你来抢</p>';
    return;
  }
  listEl.innerHTML = rows.map(function (c) {
    var time = new Date(c.created_at);
    var timeStr = isNaN(time.getTime())
      ? ""
      : time.toLocaleString("zh-CN", { hour12: false });
    var author = (c.user && c.user.login) ? c.user.login : "匿名";
    var body = mdToText(c.body);
    return (
      '<div class="gb-item">' +
        '<div class="gb-head"><span class="gb-name">' + esc(author) + "</span>" +
        '<span class="gb-time">' + esc(timeStr) + "</span></div>" +
        '<p class="gb-text">' + esc(body) + "</p>" +
      "</div>"
    );
  }).join("");
}

/* ---------- ③ 加载留言 ---------- */
function loadMessages() {
  fetch("https://api.github.com/gists/" + GIST_ID + "/comments?per_page=50")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(renderMessages)
    .catch(function (err) {
      console.error(err);
      listEl.innerHTML = '<p class="gb-empty">留言加载失败，稍后再来看看～</p>';
    });
}
loadMessages();

/* ---------- ④ 提交留言 ---------- */
var formEl = document.getElementById("guestbook-form");
var nameEl = document.getElementById("gb-name");
var textEl = document.getElementById("gb-text");

function showStatus(msg, isError) {
  statusEl.textContent = msg || "";
  statusEl.className = "guestbook-status" + (isError ? " error" : "");
}

function autoFilter(name, content) {
  var text = (name + " " + content).toLowerCase();
  var BLOCK_WORDS = ["代开发", "加微信", "加v", "兼职", "刷单", "博彩",
    "赌博", "贷款", "办证", "发票", "外挂", "sf", "私服", "广告"];
  for (var i = 0; i < BLOCK_WORDS.length; i++) {
    if (text.indexOf(BLOCK_WORDS[i].toLowerCase()) !== -1) {
      return "内容包含敏感词，已拦截";
    }
  }
  if (/https?:\/\/|www\./i.test(text)) {
    return "留言里不让放链接，广告党退散";
  }
  return null;
}

if (formEl) {
  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameEl.value.trim();
    var content = textEl.value.trim();
    if (!name || !content) return;

    var blocked = autoFilter(name, content);
    if (blocked) { showStatus(blocked, true); return; }

    // 方式 A（推荐，默认）：带内容跳转到 Gist 页面，用访客自己的 GitHub 账号评论
    var gistUrl = "https://gist.github.com/gzxxw/" + GIST_ID +
      "?comment=" + encodeURIComponent("（" + name + "）" + content);
    window.open(gistUrl, "_blank", "noopener");
    showStatus("已打开 GitHub 评论页，点底部「评论」按钮即可发布（用你的 GitHub 账号）", false);
    nameEl.value = "";
    textEl.value = "";
  });
}