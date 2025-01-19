import React, { useState } from "react";
import "../ChatBotWidget.css"; // Make sure this import path is correct

const ChatBotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ user: boolean; text: string }[]>([]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!message.trim()) return;
  
    setChatHistory((prev) => [...prev, { user: true, text: message }]);
    setMessage("");
  
    try {
      const response = await fetch("http://localhost:8000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: message }),
      });
  
      const { reply } = await response.json();
      setChatHistory((prev) => [...prev, { user: false, text: reply }]);
    } catch (err) {
      console.error("Error:", err);
      setChatHistory((prev) => [...prev, { user: false, text: "Oops! Something went wrong!" }]);
    }
  };

  return (
    <div>
      {/* Floating Chat Button */}
      <div className="chatbot-widget" onClick={toggleChat}>
        💬
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="chatbot-popup">
          <h3 className="text-lg font-bold mb-4">Chatbot</h3>
          <div className="chat-history">
            {chatHistory.map((entry, index) => (
              <p key={index} className={entry.user ? "user-message" : "bot-message"}>
                {entry.text}
              </p>
            ))}
          </div>
          <div className="flex mt-2">
            <input
              className="flex-grow border rounded-l px-4 py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-r" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotWidget;
