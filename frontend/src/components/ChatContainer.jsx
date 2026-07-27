import { useEffect, useRef, useState } from "react";
import { ChatStore } from "../store/ChatStore";
import { AuthStore } from "../store/AuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./ss/MessageSkeleton";
import { formatMessageTime } from "../../lib/util";
import { Trash2, ZoomIn, ZoomOut, X, Download, ExternalLink } from "lucide-react";

// ── File helpers ──

const getFileExtension = (url, fileName) => {
  if (fileName) {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext && ext !== fileName.toLowerCase()) return ext;
  }
  if (!url) return "";
  // Try to match extension from URL path
  const match = url.match(/\.(\w{2,5})(?:\?|$)/);
  return match ? match[1].toLowerCase() : "";
};

const getFileName = (url, fileName) => {
  if (fileName) return fileName;
  // Don't show ugly Cloudinary hashes — use a clean fallback
  const ext = getFileExtension(url, null);
  if (ext) {
    const style = FILE_STYLES[ext];
    return style ? `${style.label} Document` : `${ext.toUpperCase()} File`;
  }
  return "Document";
};

const FILE_STYLES = {
  pdf:   { bg: "bg-red-50 dark:bg-red-500/10",     border: "border-red-200 dark:border-red-500/30",   accent: "bg-red-500",   text: "text-red-600 dark:text-red-400",   sub: "text-red-400 dark:text-red-500",   label: "PDF", color: "#ef4444" },
  xlsx:  { bg: "bg-green-50 dark:bg-green-500/10",  border: "border-green-200 dark:border-green-500/30", accent: "bg-green-500", text: "text-green-600 dark:text-green-400", sub: "text-green-400 dark:text-green-500", label: "XLSX", color: "#22c55e" },
  xls:   { bg: "bg-green-50 dark:bg-green-500/10",  border: "border-green-200 dark:border-green-500/30", accent: "bg-green-500", text: "text-green-600 dark:text-green-400", sub: "text-green-400 dark:text-green-500", label: "XLS", color: "#22c55e" },
  doc:   { bg: "bg-blue-50 dark:bg-blue-500/10",    border: "border-blue-200 dark:border-blue-500/30",  accent: "bg-blue-500",  text: "text-blue-600 dark:text-blue-400",  sub: "text-blue-400 dark:text-blue-500",  label: "DOC", color: "#3b82f6" },
  docx:  { bg: "bg-blue-50 dark:bg-blue-500/10",    border: "border-blue-200 dark:border-blue-500/30",  accent: "bg-blue-500",  text: "text-blue-600 dark:text-blue-400",  sub: "text-blue-400 dark:text-blue-500",  label: "DOCX", color: "#3b82f6" },
  txt:   { bg: "bg-gray-50 dark:bg-zinc-500/10",    border: "border-gray-200 dark:border-zinc-500/30",  accent: "bg-gray-400",  text: "text-gray-600 dark:text-zinc-400",  sub: "text-gray-400 dark:text-zinc-500",  label: "TXT", color: "#a1a1aa" },
  csv:   { bg: "bg-green-50 dark:bg-green-500/10",  border: "border-green-200 dark:border-green-500/30", accent: "bg-green-500", text: "text-green-600 dark:text-green-400", sub: "text-green-400 dark:text-green-500", label: "CSV", color: "#22c55e" },
};

const DEFAULT_STYLE = { bg: "bg-gray-50 dark:bg-zinc-500/10", border: "border-gray-200 dark:border-zinc-500/30", accent: "bg-gray-400", text: "text-gray-600 dark:text-zinc-400", sub: "text-gray-400 dark:text-zinc-500", label: "FILE", color: "#a1a1aa" };

const getFileStyle = (ext) => FILE_STYLES[ext] || { ...DEFAULT_STYLE, label: ext.toUpperCase() || "FILE" };

// File icon SVG component
const FileTypeIcon = ({ ext, size = 36 }) => {
  const style = getFileStyle(ext);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size * 1.2 }}>
      <svg width={size} height={size * 1.2} viewBox="0 0 36 44" fill="none">
        <path d="M0 4C0 1.79 1.79 0 4 0H22L36 14V40C36 42.21 34.21 44 32 44H4C1.79 44 0 42.21 0 40V4Z" fill={style.color + "18"} stroke={style.color} strokeWidth="1.5"/>
        <path d="M22 0L36 14H26C23.79 14 22 12.21 22 10V0Z" fill={style.color + "30"}/>
      </svg>
      <span className="absolute bottom-1.5 left-0 right-0 text-center font-extrabold" style={{ fontSize: size * 0.22, color: style.color, letterSpacing: "0.5px" }}>
        {style.label}
      </span>
    </div>
  );
};

// ── File card in chat bubble ──

const FileCard = ({ url, fileName, onClick }) => {
  const ext = getFileExtension(url, fileName);
  const name = getFileName(url, fileName);
  const style = getFileStyle(ext);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl mb-2 cursor-pointer overflow-hidden border ${style.border} ${style.bg} hover:shadow-md transition-all min-w-[240px] max-w-[300px]`}
      onClick={onClick}
    >
      {/* Colored accent bar */}
      <div className={`w-1 self-stretch ${style.accent} shrink-0 rounded-l-xl`} />
      
      <div className="py-2.5 pl-1 shrink-0">
        <FileTypeIcon ext={ext} size={30} />
      </div>
      
      <div className="flex-1 min-w-0 py-2.5">
        <p className={`text-sm font-semibold truncate ${style.text}`}>{name}</p>
        <p className={`text-xs mt-0.5 ${style.sub}`}>{style.label} • Tap to preview</p>
      </div>
      
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 p-2 mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${style.text}`}
        onClick={(e) => e.stopPropagation()}
        title="Download"
      >
        <Download size={16} />
      </a>
    </div>
  );
};

// ── Image Lightbox with Zoom ──

const ImageLightbox = ({ src, alt, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.25, 0.5);
      if (newZoom <= 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-[101] bg-black/40 rounded-full px-2 py-1.5">
        <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white" title="Zoom Out (−)">
          <ZoomOut size={18} />
        </button>
        <span className="text-white text-xs font-mono min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white" title="Zoom In (+)">
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <a href={src} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white" title="Download">
          <Download size={18} />
        </a>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white" title="Close (Esc)">
          <X size={18} />
        </button>
      </div>

      <img
        src={src}
        alt={alt}
        className="max-h-[85vh] max-w-[90vw] object-contain select-none rounded-lg shadow-2xl"
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          transition: isDragging ? "none" : "transform 0.2s ease",
        }}
        onClick={(e) => { e.stopPropagation(); if (zoom === 1) handleZoomIn(); }}
        onWheel={handleWheel}
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e); }}
        draggable={false}
      />
    </div>
  );
};

// ── File Preview Modal ──

const PREVIEWABLE_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt"];

const FilePreviewModal = ({ src, fileName, onClose }) => {
  const ext = getFileExtension(src, fileName);
  const name = getFileName(src, fileName);
  const style = getFileStyle(ext);
  const canPreview = PREVIEWABLE_EXTS.includes(ext);
  // Google Docs Viewer can render PDFs, Word, Excel, etc. from any public URL
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`;

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-[85vh] bg-base-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200/80">
          <div className="flex items-center gap-3 min-w-0">
            <FileTypeIcon ext={ext} size={28} />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{name}</p>
              <p className={`text-xs ${style.sub || style.text}`}>{style.label} Document</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              Open
            </a>
            <a
              href={src}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary gap-1.5"
            >
              <Download size={14} />
              Download
            </a>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {canPreview ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-none"
              title="File Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-base-content/60 p-8">
              <div className="p-8 rounded-2xl" style={{ backgroundColor: style.color + "15" }}>
                <FileTypeIcon ext={ext} size={64} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-base-content">{name}</p>
                <p className="text-sm mt-1 opacity-60">Preview not available for {style.label} files</p>
              </div>
              <a
                href={src}
                download={name}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary gap-2"
              >
                <Download size={18} />
                Download to View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessageForMe,
    deleteMessageForEveryone,
  } = ChatStore();
  const { authUser } = AuthStore();
  const messageEndRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageInput />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {lightboxImage && (
        <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
      )}

      {previewFile && (
        <FilePreviewModal src={previewFile.src} fileName={previewFile.fileName} onClose={() => setPreviewFile(null)} />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isSender = message.senderId === authUser._id;
          const isLast = index === messages.length - 1;

          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
              ref={isLast ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={isSender ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                    alt="profile"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
              </div>

              <div className="chat-bubble flex flex-col relative group">
                {message.isDeletedForEveryone ? (
                  <p className="italic text-zinc-500 text-sm">This message was deleted</p>
                ) : (
                  <>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImage({ src: message.image, alt: "Image" })}
                        title="Click to zoom"
                      />
                    )}
                    {message.audio && (
                      <audio controls className="w-full mt-2">
                        <source src={message.audio} type="audio/webm" />
                        Your browser does not support the audio tag.
                      </audio>
                    )}
                    {message.file && (
                      <FileCard
                        url={message.file}
                        fileName={message.fileName}
                        onClick={() => setPreviewFile({ src: message.file, fileName: message.fileName })}
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </>
                )}

                {isSender && !message.isDeletedForEveryone && (
                  <div className="absolute top-1 right-1 p-1 hidden group-hover:flex gap-1">
                    <button onClick={() => deleteMessageForMe(message._id)} className="bg-white/30 hover:bg-white/60 rounded-full p-1" title="Delete for me">
                      <Trash2 size={14} className="text-gray-700" />
                    </button>
                    <button onClick={() => deleteMessageForEveryone(message._id)} className="bg-white/30 hover:bg-white/60 rounded-full p-1" title="Delete for everyone">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                )}

                {!isSender && (
                  <div className="absolute top-1 right-1 p-1 hidden group-hover:block">
                    <button onClick={() => deleteMessageForMe(message._id)} className="bg-white/30 hover:bg-white/60 rounded-full p-1" title="Delete for me">
                      <Trash2 size={14} className="text-gray-700" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
