import { useEffect, useState, useRef } from "react";
import { ChatStore } from "../store/ChatStore";
import { AuthStore } from "../store/AuthStore";
import { ImageIcon, Mic, Send, StopCircle, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const { selectedUser, sendMessage } = ChatStore();
  const { authUser } = AuthStore();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // blob URL for instant preview
  const [imageFile, setImageFile] = useState(null);        // raw File object
  const [filePreview, setFilePreview] = useState(null);    // file name for preview
  const [fileData, setFileData] = useState(null);          // raw File object
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const audioChunks = useRef([]);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Convert File to base64 only at send time
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (!text && !imageFile && !fileData) return;
    setIsSending(true);
    try {
      let imageBase64 = null;
      let fileBase64 = null;
      if (imageFile) imageBase64 = await fileToBase64(imageFile);
      if (fileData) fileBase64 = await fileToBase64(fileData);
      await sendMessage({ text, image: imageBase64, file: fileBase64, fileName: fileData?.name || null });
      setText("");
      // Revoke blob URLs to free memory
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageFile(null);
      setFilePreview(null);
      setFileData(null);
      setShowEmojiPicker(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Instant preview using blob URL — no base64 conversion needed
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFilePreview(selectedFile.name);
    setFileData(selectedFile);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunks.current = [];

    recorder.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const base64Audio = await fileToBase64(blob);
      await sendMessage({ audio: base64Audio });
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  if (!selectedUser) return null;

  return (
    <div className="border-t p-4 relative">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-50">
          <EmojiPicker onEmojiClick={onEmojiClick} height={350} />
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={() => {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 flex items-center gap-2 bg-base-200 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
          <span className="text-sm truncate">{filePreview}</span>
          <button
            onClick={() => {
              setFilePreview(null);
              setFileData(null);
              if (docInputRef.current) docInputRef.current.value = "";
            }}
            className="ml-auto w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          hidden
        />

        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
          ref={docInputRef}
          onChange={handleFileUpload}
          hidden
        />

        <input
          type="text"
          placeholder="Type your message..."
          className="input input-bordered flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <button onClick={handleSend} className="btn btn-circle" disabled={isSending}>
          {isSending ? <span className="loading loading-spinner loading-sm"></span> : <Send size={20} />}
        </button>

        <button onClick={() => setShowEmojiPicker((prev) => !prev)} className="btn btn-circle">
          <Smile size={20} />
        </button>

        <button onClick={() => fileInputRef.current.click()} className={`btn btn-circle ${imagePreview ? "btn-primary" : ""}`}>
          <ImageIcon size={20} />
        </button>

        <button onClick={() => docInputRef.current.click()} className="btn btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </button>

        {!isRecording ? (
          <button onClick={startRecording} className="btn btn-circle" title="Start Recording">
            <Mic size={20} />
          </button>
        ) : (
          <button onClick={stopRecording} className="btn btn-circle btn-error" title="Stop Recording">
            <StopCircle size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
