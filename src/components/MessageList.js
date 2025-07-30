import React, { useEffect, useRef } from 'react';
import Message from './Message';
import confetti from 'canvas-confetti';

const CELEBRATION_WORDS = [
  'congrats',
  'party',
  '🎉',
];

export default function MessageList({ messages, user }) {
  const lastMessageId = useRef(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.id === lastMessageId.current) return;
    lastMessageId.current = lastMsg.id;
    if (
      lastMsg.content &&
      CELEBRATION_WORDS.some((word) =>
        lastMsg.content.toLowerCase().includes(word)
      )
    ) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white dark:bg-gray-900 transition-colors duration-300" style={{ minHeight: 0 }}>
      {messages.map((message) => (
        <Message key={message.id} message={message} user={user} />
      ))}
    </div>
  );
} 