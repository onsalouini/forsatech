import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useCurrentUser } from '../hooks/useCurrentUser';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socket = io('http://localhost:5000', { autoConnect: false });

function convKey(role1, id1, role2, id2) {
  return [`${role1}:${id1}`, `${role2}:${id2}`].sort().join('__');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export default function ChatWidget() {
  const me = useCurrentUser();
  // Add temporarily at the top of the component after useCurrentUser()
console.log('👤 Current user:', me);
  const meRef = useRef(me);
  useEffect(() => { meRef.current = me; }, [me]);

  // screens: 'closed' | 'inbox' | 'search' | 'chat'
  const [screen, setScreen] = useState('closed');
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  
  const [conversations, setConversations] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const bottomRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const joinedKeysRef = useRef(new Set());
  const debounceRef = useRef(null);
  const contactRef = useRef(contact);
  useEffect(() => { contactRef.current = contact; }, [contact]);

  // ── Load inbox (stored in ref so socket listener always has fresh version) ──
  const loadInboxRef = useRef(null);
  loadInboxRef.current = async () => {
    const me = meRef.current;
    if (!me) return;
    setLoadingInbox(true);
    try {
      const res = await fetch(`${API_BASE}/dm/conversations?userId=${me.id}&userRole=${me.role}`);
      const data = await res.json();
      if (data.success) {
        console.log('📊 Unread counts:', data.conversations.map(c => ({
          with: c.otherName,
          unread: c.unreadCount
        })));
        setConversations(data.conversations);
        setTotalUnread(data.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingInbox(false);
    }
  };

  const loadInbox = () => loadInboxRef.current();

  // ── Socket setup ──────────────────────────────────────────────
  // ── Socket setup ──────────────────────────────────────────────
useEffect(() => {
  socket.connect();

  // Re-join all rooms after any (re)connection
 const rejoinRooms = () => {
  const me = meRef.current;
  if (!me) return;
  joinedKeysRef.current.forEach((key) => {
    const parts = key.split('__').map((p) => {
      const idx = p.indexOf(':');
      return { role: p.slice(0, idx), id: p.slice(idx + 1) };
    });
    const myPart = parts.find((p) => p.id === me.id);
    const otherPart = parts.find((p) => p.id !== me.id);
    // Only rejoin valid recruiter↔candidate rooms
    if (myPart && otherPart && myPart.role !== otherPart.role) {
      socket.emit('dm:join', {
        myRole: myPart.role, myId: myPart.id,
        otherRole: otherPart.role, otherId: otherPart.id,
      });
    }
  });
};
  socket.on('connect', () => {
    console.log('✅ Socket connected');
    rejoinRooms();
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
    // Clear joined keys so they get re-joined on reconnect
    joinedKeysRef.current = new Set();
  });

  socket.on('dm:message', (msg) => {
    console.log('📨 Message received:', msg);
    const me = meRef.current;
    const currentContact = contactRef.current;
    const currentScreen = screenRef.current;

    if (currentScreen === 'chat' && currentContact && me) {
      const activeKey = convKey(me.role, me.id, currentContact.role, currentContact.id);
      if (msg.conversationKey === activeKey) {
        setMessages((prev) =>
          prev.find((m) => String(m._id) === String(msg._id))
            ? prev
            : [...prev, { ...msg, senderId: String(msg.senderId) }]
        );
        if (String(msg.senderId) !== String(me.id)) {
          fetch(`${API_BASE}/dm/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationKey: activeKey, userId: me.id }),
          }).catch(() => {});
        }
        setTimeout(() => loadInboxRef.current(), 100);
        return;
      }
    }
    loadInboxRef.current();
  });

  socket.on('dm:error', (e) => console.error('[DM error]', e.message));

  return () => {
    socket.off('dm:message');
    socket.off('dm:error');
    socket.off('connect');
    socket.off('disconnect');
    socket.disconnect();
  };
}, []);

// ── Join ALL existing conversation rooms on load ───────────────
useEffect(() => {
  if (!me) return;
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/dm/conversations?userId=${me.id}&userRole=${me.role}`);
      const data = await res.json();
      if (!data.success) return;

      data.conversations.forEach((conv) => {
        if (!joinedKeysRef.current.has(conv.conversationKey)) {
          // Only emit if socket is already connected
          if (socket.connected) {
            console.log('Joining room:', conv.conversationKey);
            socket.emit('dm:join', {
              myRole: me.role, myId: me.id,
              otherRole: conv.otherRole, otherId: conv.otherId,
            });
          }
          // Always track it so rejoinRooms() can re-emit after connect
          joinedKeysRef.current.add(conv.conversationKey);
        }
      });

      setConversations(data.conversations);
      setTotalUnread(data.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    } catch {
      // silently fail
    }
  })();
}, [me]);

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, screen]);

  // ── Focus inputs ──────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'search') setTimeout(() => searchRef.current?.focus(), 80);
    if (screen === 'chat') setTimeout(() => inputRef.current?.focus(), 80);
  }, [screen]);

  // ── Reload inbox when opening it ─────────────────────────────
  useEffect(() => {
    if (screen === 'inbox') loadInbox();
  }, [screen]);

  // ── Debounced search ──────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
  setSearching(true);
  try {
    const me = meRef.current;
    const url = `${API_BASE}/dm/search?q=${encodeURIComponent(query)}&excludeId=${me?.id ?? ''}&excludeRole=${me?.role ?? ''}`;
    console.log('🔍 Searching:', url);  // ADD
    const res = await fetch(url);
    const data = await res.json();
    console.log('🔍 Search results:', data);  // ADD
    if (data.success) setResults(data.results);
  } catch (e) {
    console.error('Search failed:', e);  // ADD
  } finally {
    setSearching(false);
  }
}, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Open chat from inbox or search ───────────────────────────
  const openChat = async (person) => {
    const me = meRef.current;
    if (!me) return;
    setContact(person);
    setScreen('chat');

    const key = convKey(me.role, me.id, person.role, person.id);

    // Join room if not already joined
    if (!joinedKeysRef.current.has(key)) {
      console.log('Joining room from openChat:', key);
      socket.emit('dm:join', {
        myRole: me.role, myId: me.id,
        otherRole: person.role, otherId: person.id,
      });
      joinedKeysRef.current.add(key);
    }

    // Load history first
    setLoadingHistory(true);
    setMessages([]);
    try {
      const res = await fetch(`${API_BASE}/dm/history?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        console.log('Messages loaded:', data.messages.length);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }

    // THEN mark as read after loading history
    try {
      await fetch(`${API_BASE}/dm/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationKey: key, userId: me.id }),
      });
      console.log('Marked messages as read for conversation:', key);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }

    // Refresh inbox to update unread counts
    await loadInboxRef.current();
  };

  const handleSend = () => {
  const me = meRef.current;
  if (!text.trim() || !me || !contact) return;
  
  console.log('📤 Sending message:', {
    myRole: me.role,
    myId: me.id,
    otherRole: contact.role,
    otherId: contact.id,
    text: text.trim(),
    socketConnected: socket.connected,  // ADD THIS
    socketId: socket.id,                // ADD THIS
  });
  
  const tempMessage = {
    _id: `temp-${Date.now()}`,
    senderId: me.id,
    senderName: me.name,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    isTemp: true
  };
  
  setMessages(prev => [...prev, tempMessage]);
  
  socket.emit('dm:send', {
    myRole: me.role, myId: me.id, myName: me.name,
    otherRole: contact.role, otherId: contact.id,
    text: text.trim(),
  });
  
  setText('');
};

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const openInbox = () => setScreen('inbox');
  const close = () => setScreen('closed');
  const goToSearch = () => { setQuery(''); setResults([]); setScreen('search'); };
  const backToInbox = () => { setScreen('inbox'); };

  if (!me) return null;

  return (
    <div style={s.wrapper}>

      {/* ── INBOX SCREEN ── */}
      {screen === 'inbox' && (
        <div style={s.panel}>
          <div style={s.header}>
            <span style={{ fontWeight: 700 }}>Messages</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.iconBtn} onClick={goToSearch} title="Nouvelle conversation">✏️</button>
              <button style={s.closeBtn} onClick={close}>✕</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingInbox && <div style={s.hint}>Chargement...</div>}
            {!loadingInbox && conversations.length === 0 && (
              <div style={s.hint}>
                Aucune conversation.<br />
                <button style={s.linkBtn} onClick={goToSearch}>Démarrer une conversation</button>
              </div>
            )}
            {conversations.map((conv) => {
              const isMine = String(conv.lastMessage.senderId) === String(me.id);
              const preview = `${isMine ? 'Vous: ' : ''}${conv.lastMessage.text}`;
              return (
                <button
                  key={conv.conversationKey}
                  style={s.convItem(conv.unreadCount > 0)}
                  onClick={() => openChat({
                    id: conv.otherId,
                    role: conv.otherRole,
                    name: conv.otherName,
                    subtitle: conv.otherSubtitle,
                  })}
                >
                  <div style={s.avatarWrap}>
                    <div style={s.avatar}>{conv.otherName.charAt(0).toUpperCase()}</div>
                    {conv.unreadCount > 0 && (
                      <div style={s.unreadDot}>+{conv.unreadCount > 99 ? '99' : conv.unreadCount}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: conv.unreadCount > 0 ? 700 : 600, fontSize: 14 }}>
                        {conv.otherName}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                        {timeAgo(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: conv.unreadCount > 0 ? '#0f172a' : '#64748b',
                      fontWeight: conv.unreadCount > 0 ? 600 : 400,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {preview}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SEARCH SCREEN ── */}
      {screen === 'search' && (
        <div style={s.panel}>
          <div style={s.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={s.backBtn} onClick={backToInbox}>←</button>
              <span style={{ fontWeight: 700 }}>Nouvelle conversation</span>
            </div>
            <button style={s.closeBtn} onClick={close}>✕</button>
          </div>

          <div style={s.searchBox}>
            <span style={s.searchIcon}>🔍</span>
            <input
              ref={searchRef}
              style={s.searchInput}
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {searching && <div style={s.hint}>Recherche...</div>}
            {!searching && query.length > 0 && results.length === 0 && (
              <div style={s.hint}>Aucun résultat pour « {query} »</div>
            )}
            {!searching && query.length === 0 && (
              <div style={s.hint}>Tapez un prénom ou nom</div>
            )}
            {results.map((r) => (
              <button key={`${r.role}:${r.id}`} style={s.resultItem} onClick={() => openChat(r)}>
                <div style={s.avatar}>{r.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{r.subtitle}</div>
                </div>
                <div style={s.roleBadge(r.role)}>
                  {r.role === 'recruiter' ? 'Recruteur' : 'Candidat'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT SCREEN ── */}
      {screen === 'chat' && contact && (
        <div style={s.panel}>
          <div style={s.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button style={s.backBtn} onClick={backToInbox}>←</button>
              <div style={s.avatar}>{contact.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{contact.name}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>{contact.subtitle}</div>
              </div>
            </div>
            <button style={s.closeBtn} onClick={close}>✕</button>
          </div>

          <div style={s.messages}>
            {loadingHistory && <div style={s.hint}>Chargement...</div>}
            {!loadingHistory && messages.length === 0 && (
              <div style={s.hint}>Aucun message. Dites bonjour 👋</div>
            )}
            {messages.map((msg, i) => {
              // Skip temporary messages that have been replaced
              if (msg.isTemp && messages.some(m => !m.isTemp && m.text === msg.text && String(m.senderId) === String(msg.senderId))) {
                return null;
              }
              const isMine = String(msg.senderId) === String(me.id);
              return (
                <div key={msg._id || i} style={{ ...s.bubble, ...(isMine ? s.mine : s.theirs) }}>
                  {!isMine && <div style={s.senderName}>{msg.senderName}</div>}
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{msg.text}</div>
                  <div style={s.time}>
                    {msg.isTemp ? '...' : new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={s.inputRow}>
            <input
              ref={inputRef}
              style={s.input}
              placeholder="Votre message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.4 }}
              onClick={handleSend}
              disabled={!text.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── FAB with unread badge ── */}
      <div style={{ position: 'relative' }}>
        <button style={s.fab} onClick={screen === 'closed' ? openInbox : close}>
          {screen === 'closed' ? '💬' : '✕'}
        </button>
        {screen === 'closed' && totalUnread > 0 && (
          <div style={s.fabBadge}>
            +{totalUnread > 99 ? '99' : totalUnread}
          </div>
        )}
      </div>
    </div>
  );
}

const GRAD = 'linear-gradient(135deg, #06213a, #0a4c73)';

const s = {
  wrapper: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
  },
  fab: {
    width: 52, height: 52, borderRadius: '50%', background: GRAD,
    color: '#fff', border: 'none', fontSize: 22, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(10,76,115,0.4)',
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    background: '#ef4444', color: '#fff',
    borderRadius: '50%', minWidth: 20, height: 20,
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #fff', padding: '0 3px',
  },
  panel: {
    width: 320, height: 460, borderRadius: 16, overflow: 'hidden',
    background: '#fff', boxShadow: '0 8px 40px rgba(10,76,115,0.2)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    background: GRAD, color: '#fff', padding: '12px 14px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    borderRadius: 8, padding: '3px 8px', cursor: 'pointer', fontSize: 15,
  },
  iconBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    borderRadius: 8, padding: '3px 8px', cursor: 'pointer', fontSize: 15,
  },
  convItem: (unread) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: unread ? '#f0f7ff' : 'none',
    border: 'none', borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer', textAlign: 'left',
  }),
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 38, height: 38, borderRadius: '50%', background: GRAD,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
  },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    background: '#ef4444', color: '#fff',
    borderRadius: '50%', minWidth: 16, height: 16,
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid #fff',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, background: 'transparent', color: '#0f172a',
  },
  resultItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left',
  },
  hint: {
    textAlign: 'center', fontSize: 13, color: '#94a3b8', padding: '24px 16px', lineHeight: 1.8,
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#0a4c73',
    fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
  },
  roleBadge: (role) => ({
    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
    borderRadius: 99, padding: '2px 8px', flexShrink: 0,
    background: role === 'recruiter' ? '#eff6ff' : '#f0fdf4',
    color: role === 'recruiter' ? '#1d4ed8' : '#15803d',
  }),
  messages: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 4px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  bubble: { maxWidth: '78%', padding: '8px 12px', borderRadius: 14 },
  mine: {
    alignSelf: 'flex-end', background: GRAD,
    color: '#fff', borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start', background: '#eef8ff',
    color: '#0f172a', borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 11, fontWeight: 700, marginBottom: 2, opacity: 0.65 },
  time: { fontSize: 10, marginTop: 3, opacity: 0.55, textAlign: 'right' },
  inputRow: {
    display: 'flex', gap: 8, padding: 10,
    borderTop: '1px solid #e2e8f0', alignItems: 'center', flexShrink: 0,
  },
  input: {
    flex: 1, padding: '8px 12px', borderRadius: 99,
    border: '1px solid #d7dce5', fontSize: 14, outline: 'none',
  },
  sendBtn: {
    padding: '8px 14px', background: GRAD, color: '#fff',
    border: 'none', borderRadius: 99, cursor: 'pointer', fontSize: 16,
  },
};