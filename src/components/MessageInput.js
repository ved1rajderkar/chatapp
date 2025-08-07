import React, { useState, useRef } from 'react';

export default function MessageInput({ onSendMessage, disabled, onTypingStart, onTypingStop }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping.current && onTypingStart) {
      onTypingStart();
      isTyping.current = true;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (isTyping.current && onTypingStop) {
        onTypingStop();
        isTyping.current = false;
      }
    }, 1000);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!message.trim() && !file) || disabled) return;
    if (file) {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (ev) => {
        onSendMessage({
          type: isImage ? 'image' : 'file',
          content: message,
          fileName: file.name,
          fileType: file.type,
          fileData: ev.target.result,
        });
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file); // For demo, use base64 for all
      }
      setFile(null);
      setFilePreview(null);
      setMessage('');
    } else {
      onSendMessage(message);
      setMessage('');
    }
    if (onTypingStop && isTyping.current) {
      onTypingStop();
      isTyping.current = false;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  return (
    <div className="flex items-center space-x-2 p-3 bg-white/30 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-300">
      <button
        type="button"
        onClick={handleFileButtonClick}
        className="btn btn-ghost rounded-none rounded-r-md"
        title="Attach file"
      >
        📎
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {filePreview && (
        <img src={filePreview} alt="preview" className="w-10 h-10 object-cover rounded shadow mr-2" />
      )}
      {file && !filePreview && (
        <span className="text-xs text-gray-500 dark:text-gray-300 mr-2">{file.name}</span>
      )}
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder="Type a message..."
        className="input input-bordered flex-1 px-4 py-2 rounded-l-md focus:outline-none dark:bg-gray-700 dark:text-gray-100"
      />
      <button
        type="submit"
        className="btn btn-primary ml-2"
        disabled={!message.trim() && !file}
      >
        Send
      </button>
    </div>
  );
} 