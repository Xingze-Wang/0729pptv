document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOM is fully loaded. Initializing script...');

    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewArea = document.getElementById('file-preview-area');
    const fileList = document.getElementById('file-list');
    const clearFilesBtn = document.getElementById('clear-files');

    // File management
    let selectedFiles = [];

    // --- API 配置 ---
    const API_URL = '/api/chat';
    console.log(`[CONFIG] API Endpoint set to: ${API_URL}`);
    
    // --- 文件处理函数 ---
    
    function getFileTypeIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const icons = {
            pdf: `<svg class="file-type-icon file-type-pdf" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>`,
            doc: `<svg class="file-type-icon file-type-doc" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>`,
            docx: `<svg class="file-type-icon file-type-doc" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                   </svg>`,
            txt: `<svg class="file-type-icon file-type-txt" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>`,
            ppt: `<svg class="file-type-icon file-type-ppt" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>`,
            pptx: `<svg class="file-type-icon file-type-ppt" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                   </svg>`
        };
        return icons[extension] || icons.txt;
    }

    function addFileToPreview(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            ${getFileTypeIcon(file.name)}
            <span class="file-name" title="${file.name}">${file.name}</span>
            <button type="button" class="file-remove" data-file-name="${file.name}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        
        fileList.appendChild(fileItem);
        
        // Add remove functionality
        const removeBtn = fileItem.querySelector('.file-remove');
        removeBtn.addEventListener('click', () => {
            removeFile(file.name);
        });
    }

    function removeFile(fileName) {
        selectedFiles = selectedFiles.filter(file => file.name !== fileName);
        updateFilePreview();
    }

    function updateFilePreview() {
        fileList.innerHTML = '';
        
        if (selectedFiles.length > 0) {
            filePreviewArea.style.display = 'block';
            selectedFiles.forEach(file => addFileToPreview(file));
            fileUploadBtn.classList.add('active');
        } else {
            filePreviewArea.style.display = 'none';
            fileUploadBtn.classList.remove('active');
        }
    }

    // --- 事件监听器 ---

    // 文件上传按钮
    fileUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);
        
        // 添加新文件到现有列表
        files.forEach(file => {
            // 检查是否已存在同名文件
            if (!selectedFiles.some(existingFile => existingFile.name === file.name)) {
                selectedFiles.push(file);
            }
        });
        
        updateFilePreview();
        
        // 重置input，允许重复选择相同文件
        fileInput.value = '';
    });

    // 清除所有文件
    clearFilesBtn.addEventListener('click', () => {
        selectedFiles = [];
        updateFilePreview();
    });

    // 拖拽文件支持
    chatForm.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatForm.style.backgroundColor = '#f0f0f0';
    });

    chatForm.addEventListener('dragleave', (e) => {
        e.preventDefault();
        chatForm.style.backgroundColor = '';
    });

    chatForm.addEventListener('drop', (e) => {
        e.preventDefault();
        chatForm.style.backgroundColor = '';
        
        const files = Array.from(e.dataTransfer.files);
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
        
        files.forEach(file => {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (allowedTypes.includes(extension)) {
                if (!selectedFiles.some(existingFile => existingFile.name === file.name)) {
                    selectedFiles.push(file);
                }
            }
        });
        
        updateFilePreview();
    });

    // 键盘事件 - 回车发送
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // 表单提交事件
    chatForm.addEventListener('submit', async (event) => {
        console.log('[EVENT] Form submitted.');
        event.preventDefault();
        
        const userMessage = userInput.value.trim();
        if (userMessage === '' && selectedFiles.length === 0) return;

        // 显示用户消息
        if (userMessage) {
            addMessage('You', userMessage);
        }
        
        // 显示文件信息
        if (selectedFiles.length > 0) {
            const fileNames = selectedFiles.map(f => f.name).join(', ');
            addMessage('You', `📎 上传文件: ${fileNames}`, true);
        }

        userInput.value = '';
        userInput.style.height = 'auto';

        const typingIndicator = addTypingIndicator();

        try {
            const aiResponse = await sendMessageWithFiles(userMessage, selectedFiles);
            typingIndicator.remove();
            addMessage('AI', aiResponse);
        } catch (error) {
            typingIndicator.remove();
            console.error('[CRITICAL ERROR] Failed to get AI response. Full error object:', error);
            addMessage('AI', '抱歉，连接时出现问题。(详情请查看控制台)');
        }

        // 清除文件选择
        selectedFiles = [];
        updateFilePreview();
    });
    
    // --- 核心功能函数 ---

    async function sendMessageWithFiles(message, files) {
        const formData = new FormData();
        formData.append('message', message);
        
        // 添加文件
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'The server returned an error.');
            }

            const data = await response.json();
            return data.reply;

        } catch (error) {
            console.error('Error sending message with files:', error);
            return "Sorry, I'm having trouble connecting to the server.";
        }
    }

    // --- UI 辅助函数 ---

    function addMessage(sender, message, isFileMessage = false) {
        const messageElement = createMessageElement(sender, message, false, isFileMessage);
        chatLog.appendChild(messageElement);
        scrollToBottom();
    }
    
    function addTypingIndicator() {
        const indicatorElement = createMessageElement('AI', '正在输入...', true);
        chatLog.appendChild(indicatorElement);
        scrollToBottom();
        return indicatorElement;
    }

    function createMessageElement(sender, message, isTyping = false, isFileMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        if (isTyping) {
            messageElement.classList.add('typing-indicator');
        }
        
        const senderElement = document.createElement('p');
        senderElement.classList.add('message-sender');
        if (sender === 'AI') {
            senderElement.classList.add('ai');
        }
        senderElement.textContent = sender;
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        if (isFileMessage) {
            contentElement.innerHTML = `<p style="color: #666; font-style: italic;">${message}</p>`;
        } else {
            contentElement.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
        }
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        return messageElement;
    }

    function scrollToBottom() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});