document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewArea = document.getElementById('file-preview-area');
    const fileList = document.getElementById('file-list');
    const clearFilesBtn = document.getElementById('clear-files');

    // 已选文件列表
    let selectedFiles = [];
    const API_URL = '/api/chat';

    // 转义 HTML，防止注入
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;");
    }

    // 渲染支持 **粗体** 及换行
    function renderMessageContent(text) {
        const escaped = escapeHtml(text);
        const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return withBold.replace(/\n/g, '<br>');
    }

    // 创建单条消息元素
    function createMessageElement(sender, message, isTyping = false) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('chat-message');
        if (isTyping) wrapper.classList.add('typing-indicator');

        const senderEl = document.createElement('p');
        senderEl.classList.add('message-sender');
        if (sender === 'AI') senderEl.classList.add('ai');
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

    // 添加消息到聊天记录
    function addMessage(sender, message, isTyping = false) {
        const el = createMessageElement(sender, message, isTyping);
        chatLog.appendChild(el);
        scrollToBottom();
        return el;
    }

    // 根据文件扩展名返回对应图标（这里用 Emoji 代表）
    function getFileTypeIcon(name) {
        const ext = name.split('.').pop().toLowerCase();
        const icons = {
            pdf: '📄', doc: '📄', docx: '📄',
            txt: '📄', ppt: '📄', pptx: '📄'
        };
        return icons[ext] || icons.txt;
    }

    // 更新文件预览区
    function updateFilePreview() {
        fileList.innerHTML = '';
        if (selectedFiles.length) {
            filePreviewArea.style.display = 'block';
            selectedFiles.forEach(f => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = `
                    ${getFileTypeIcon(f.name)}
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

    // 绑定文件上传按钮
    fileUploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = e => {
        Array.from(e.target.files).forEach(f => {
            if (!selectedFiles.some(x => x.name === f.name)) {
                selectedFiles.push(f);
            }
        });
        updateFilePreview();
        fileInput.value = '';
    };
    clearFilesBtn.onclick = () => {
        selectedFiles = [];
        updateFilePreview();
    };

    // 拖拽上传支持
    chatForm.addEventListener('dragover', e => {
        e.preventDefault();
        chatForm.style.backgroundColor = '#f0f0f0';
    });
    chatForm.addEventListener('dragleave', e => {
        e.preventDefault();
        chatForm.style.backgroundColor = '';
    });
    chatForm.addEventListener('drop', e => {
        e.preventDefault();
        chatForm.style.backgroundColor = '';
        const files = Array.from(e.dataTransfer.files);
        const allowed = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
        files.forEach(f => {
            const ext = '.' + f.name.split('.').pop().toLowerCase();
            if (allowed.includes(ext) && !selectedFiles.some(x => x.name === f.name)) {
                selectedFiles.push(f);
            }
        });
        updateFilePreview();
    });

    // 回车发送（Shift+Enter 换行）
    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // 提交表单并清理预览
    chatForm.addEventListener('submit', async e => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text && !selectedFiles.length) return;

        // 缓存将要发送的文件
        const filesToSend = selectedFiles.slice();

        // 禁用用户输入
        userInput.disabled = sendButton.disabled = fileUploadBtn.disabled
            = clearFilesBtn.disabled = fileInput.disabled = true;

        // 合并文字与文件列表于同一气泡
        let combined = text;
        if (filesToSend.length) {
            const names = filesToSend.map(f => f.name).join(', ');
            combined += `\n\n📎 上传文件: ${names}`;
        }
        addMessage('You', combined);

        // 构建 FormData
        const form = new FormData();
        form.append('message', text);
        filesToSend.forEach(f => form.append('files', f));

        // 立即清空预览
        selectedFiles = [];
        updateFilePreview();
        fileInput.value = '';

        userInput.value = '';
        userInput.style.height = 'auto';

        const typingEl = addMessage('AI', '正在输入...', true);

        try {
            const resp = await fetch(API_URL, { method: 'POST', body: form });
            const data = await resp.json();
            typingEl.remove();
            addMessage('AI', data.reply);
        } catch (err) {
            typingEl.remove();
            addMessage('AI', '抱歉，连接出现问题。');
            console.error(err);
        } finally {
            // 恢复用户输入
            userInput.disabled = sendButton.disabled = fileUploadBtn.disabled
                = clearFilesBtn.disabled = fileInput.disabled = false;
            userInput.focus();
        }
    });
});
