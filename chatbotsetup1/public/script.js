document.addEventListener('DOMContentLoaded', () => {
  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const stopButton = document.getElementById('stop-button');
  const fileUploadBtn = document.getElementById('file-upload-btn');
  const fileInput = document.getElementById('file-input');
  const filePreviewArea = document.getElementById('file-preview-area');
  const fileList = document.getElementById('file-list');
  const clearFilesBtn = document.getElementById('clear-files');
  const API_URL = '/api/chat';

  let selectedFiles = [];

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }

  function renderMessageContent(text) {
    const safe = escapeHtml(text);
    return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
               .replace(/\n/g, '<br>');
  }

  function createMessageElement(sender, message, isTyping = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-message');
    if (isTyping) wrapper.classList.add('typing-indicator');

    const senderEl = document.createElement('p');
    senderEl.classList.add('message-sender');
    if (sender !== 'You') senderEl.classList.add(sender);
    senderEl.textContent = sender;

    const contentEl = document.createElement('div');
    contentEl.classList.add('message-content');
    contentEl.innerHTML = `<p>${renderMessageContent(message)}</p>`;

    wrapper.appendChild(senderEl);
    wrapper.appendChild(contentEl);
    return wrapper;
  }

  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addMessage(sender, message, isTyping = false) {
    const el = createMessageElement(sender, message, isTyping);
    chatLog.appendChild(el);
    scrollToBottom();
    return el;
  }

  function getFileTypeIcon() {
    return '📄';
  }

  function updateFilePreview() {
    fileList.innerHTML = '';
    if (selectedFiles.length) {
      filePreviewArea.style.display = 'block';
      selectedFiles.forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          ${getFileTypeIcon()}
          <span class="file-name" title="${f.name}">${f.name}</span>
          <button class="file-remove" data-name="${f.name}">×</button>
        `;
        item.querySelector('.file-remove').onclick = () => {
          selectedFiles = selectedFiles.filter(x => x.name !== f.name);
          updateFilePreview();
        };
        fileList.appendChild(item);
      });
      fileUploadBtn.classList.add('active');
    } else {
      filePreviewArea.style.display = 'none';
      fileUploadBtn.classList.remove('active');
    }
  }

  function disableInputs(disable) {
    [userInput, sendButton, stopButton, fileUploadBtn, clearFilesBtn, fileInput]
      .forEach(el => el.disabled = disable);
  }

  // File upload handlers
  fileUploadBtn.onclick = () => fileInput.click();
  fileInput.onchange = e => {
    Array.from(e.target.files).forEach(f => {
      if (!selectedFiles.some(x => x.name === f.name)) selectedFiles.push(f);
    });
    updateFilePreview();
    fileInput.value = '';
  };
  clearFilesBtn.onclick = () => { selectedFiles = []; updateFilePreview(); };

  // Drag & drop
  chatForm.addEventListener('dragover', e => {
    e.preventDefault();
    chatForm.classList.add('dragover');
  });
  chatForm.addEventListener('dragleave', e => {
    e.preventDefault();
    chatForm.classList.remove('dragover');
  });
  chatForm.addEventListener('drop', e => {
    e.preventDefault();
    chatForm.classList.remove('dragover');
    Array.from(e.dataTransfer.files)
      .filter(f => ['.pdf','.doc','.docx','.txt','.ppt','.pptx']
        .includes('.' + f.name.split('.').pop().toLowerCase()))
      .forEach(f => {
        if (!selectedFiles.some(x => x.name === f.name)) selectedFiles.push(f);
      });
    updateFilePreview();
  });

  // Enter to send
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // Form submission
  chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text && !selectedFiles.length) return;

    // remove old statuses
    chatLog.querySelectorAll('.expert-status').forEach(el => el.remove());

    disableInputs(true);

    // Show user bubble
    let combined = text;
    if (selectedFiles.length) {
      combined += `\n\n📎 上传文件: ${selectedFiles.map(f => f.name).join(', ')}`;
    }
    const userBubble = addMessage('You', combined);

    // Insert new expert status under this bubble
    const statusEl = document.createElement('div');
    statusEl.className = 'expert-status';
    statusEl.textContent = '专家匹配中...';
    chatLog.insertBefore(statusEl, userBubble.nextSibling);
    scrollToBottom();

    // Prepare and send
    const formData = new FormData();
    formData.append('message', text);
    selectedFiles.forEach(f => formData.append('files', f));
    selectedFiles = [];
    updateFilePreview();
    userInput.value = '';

    // Typing indicator
    const typingEl = addMessage('Dean', '正在输入...', true);

    try {
      const resp = await fetch(API_URL, { method: 'POST', body: formData });
      const data = await resp.json();
      const modeLabel = data.role && data.role !== 'default' ? data.role : 'Dean';

      // Update and remove status
      statusEl.textContent = `${modeLabel} 模式激活中...`;
      setTimeout(() => statusEl.remove(), 1000);

      // Replace typing with reply
      typingEl.remove();
      addMessage(modeLabel, data.reply);
    } catch (err) {
      console.error(err);
      typingEl.remove();
      statusEl.remove();
      addMessage('Dean', '抱歉，连接出现问题。');
    } finally {
      disableInputs(false);
      userInput.focus();
    }
  });
});

