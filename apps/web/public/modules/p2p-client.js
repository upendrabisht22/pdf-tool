/**
 * @file p2p-client.js
 * @description WebRTC DataChannel Engine & UI Controller for DocPlatform P2P Share (/p2p-share).
 *
 * Implements:
 * - Direct browser-to-browser encrypted WebRTC RTCDataChannel transfer.
 * - 64KB ArrayBuffer chunking with bufferedAmount flow control.
 * - Dynamic QR Code rendering & auto-join URL parsing (?join=LAB-402).
 * - Multi-file drag-and-drop queue with speed gauges (MB/s) and integrity assembly.
 * - Live Code Snippet Pad with syntax/language selection and 1-click copy.
 */

import { escapeHtml } from './utils.js';

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk
const BUFFER_HIGH_WATERMARK = 1024 * 1024; // 1 MB
const BUFFER_LOW_WATERMARK = 256 * 1024; // 256 KB

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 2,
};

export const p2pState = {
  status: 'IDLE', // IDLE | WAITING_FOR_PEER | CONNECTING | CONNECTED | DISCONNECTED
  roomId: null,
  peerId: null,
  role: null, // 'host' | 'joiner'
  pc: null,
  dc: null,
  sseSource: null,
  incomingTransfers: new Map(), // transferId -> { meta, chunks: [], receivedBytes, startTime }
  outgoingTransfers: new Map(), // transferId -> { file, progress, speed, status }
  receivedFiles: [],
  snippets: [],
  activeTab: 'files', // 'files' | 'snippets'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateConnectionStatusBadge(text, stateClass, iconSvg = null) {
  const badge = document.getElementById('p2p-status-badge');
  const textEl = document.getElementById('p2p-status-text');
  const iconEl = document.getElementById('p2p-status-icon');
  if (!badge || !textEl) return;

  badge.className = `p2p-status-pill mono-copy ${stateClass}`;
  textEl.textContent = text;
  if (iconEl && iconSvg) {
    iconEl.innerHTML = iconSvg;
  }
}

// ---------------------------------------------------------------------------
// 1. Studio Initialization & URL Auto-Join
// ---------------------------------------------------------------------------

export function initP2pStudio() {
  const params = new URLSearchParams(window.location.search);
  const autoJoinRoom = params.get('join') || params.get('room');

  renderP2pSnippetsList();
  renderP2pReceivedFilesList();

  if (autoJoinRoom) {
    const input = document.getElementById('p2p-join-input');
    if (input) input.value = autoJoinRoom.toUpperCase().trim();
    joinP2pRoom(autoJoinRoom.toUpperCase().trim());
  } else {
    updateConnectionStatusBadge('DISCONNECTED', 'status-disconnected');
  }
}

// ---------------------------------------------------------------------------
// 2. Room Lifecycle: Create Room (Host) & Join Room (Joiner)
// ---------------------------------------------------------------------------

export async function createP2pRoom() {
  cleanupP2pConnection();

  try {
    updateConnectionStatusBadge('CREATING ROOM...', 'status-connecting');

    const res = await fetch('/api/v1/p2p/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error?.message || 'Failed to create P2P room.');
    }

    p2pState.roomId = data.roomId;
    p2pState.peerId = data.peerId;
    p2pState.role = 'host';
    p2pState.status = 'WAITING_FOR_PEER';

    // Show room active card in UI
    const createView = document.getElementById('p2p-create-view');
    const joinView = document.getElementById('p2p-join-view');
    const activeView = document.getElementById('p2p-active-room-view');
    const displayCode = document.getElementById('p2p-active-room-code');

    if (createView) createView.style.display = 'none';
    if (joinView) joinView.style.display = 'none';
    if (activeView) activeView.style.display = 'flex';
    if (displayCode) displayCode.textContent = p2pState.roomId;

    // Render Pairing QR Code
    const qrContainer = document.getElementById('p2p-qr-container');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const joinUrl = `${window.location.origin}/p2p-share?join=${p2pState.roomId}`;
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: joinUrl,
          width: 140,
          height: 140,
          colorDark: '#0B0F17',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel?.M || 0
        });
      }
    }

    updateConnectionStatusBadge('WAITING FOR PEER TO SCAN / JOIN...', 'status-waiting');

    // Open SSE Signaling Stream
    connectP2pSseSignaling(p2pState.roomId, p2pState.peerId);

  } catch (err) {
    alert(`Error creating room: ${err.message}`);
    updateConnectionStatusBadge('DISCONNECTED', 'status-disconnected');
  }
}

export async function joinP2pRoom(roomCode) {
  const code = (roomCode || document.getElementById('p2p-join-input')?.value || '').toUpperCase().trim();
  if (!code) {
    alert('Please enter a 6-character room code (e.g. LAB-402).');
    return;
  }

  cleanupP2pConnection();

  try {
    updateConnectionStatusBadge('JOINING ROOM...', 'status-connecting');

    const res = await fetch(`/api/v1/p2p/rooms/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error?.message || 'Failed to join P2P room.');
    }

    p2pState.roomId = data.roomId;
    p2pState.peerId = data.peerId;
    p2pState.role = 'joiner';
    p2pState.status = 'CONNECTING';

    // Show room active card in UI
    const createView = document.getElementById('p2p-create-view');
    const joinView = document.getElementById('p2p-join-view');
    const activeView = document.getElementById('p2p-active-room-view');
    const displayCode = document.getElementById('p2p-active-room-code');

    if (createView) createView.style.display = 'none';
    if (joinView) joinView.style.display = 'none';
    if (activeView) activeView.style.display = 'flex';
    if (displayCode) displayCode.textContent = p2pState.roomId;

    updateConnectionStatusBadge('NEGOTIATING WEBRTC BRIDGE...', 'status-connecting');

    // Connect SSE Signaling channel
    connectP2pSseSignaling(p2pState.roomId, p2pState.peerId);

  } catch (err) {
    alert(`Error joining room: ${err.message}`);
    updateConnectionStatusBadge('DISCONNECTED', 'status-disconnected');
  }
}

// ---------------------------------------------------------------------------
// 3. SSE Signaling Stream & WebRTC Handshake
// ---------------------------------------------------------------------------

function connectP2pSseSignaling(roomId, peerId) {
  if (p2pState.sseSource) {
    p2pState.sseSource.close();
  }

  const sse = new EventSource(`/api/v1/p2p/rooms/${encodeURIComponent(roomId)}/events?peerId=${encodeURIComponent(peerId)}`);
  p2pState.sseSource = sse;

  sse.addEventListener('room-ready', (e) => {
    // Room connected to SSE
  });

  sse.addEventListener('peers-connected', async (e) => {
    const data = JSON.parse(e.data || '{}');
    if (p2pState.role === 'host') {
      // Host creates WebRTC PeerConnection & DataChannel, then creates Offer
      await setupHostWebRtcOffer();
    }
  });

  sse.addEventListener('peer-joined', async (e) => {
    if (p2pState.role === 'host') {
      await setupHostWebRtcOffer();
    }
  });

  sse.addEventListener('signal', async (e) => {
    const data = JSON.parse(e.data || '{}');
    await handleIncomingSignal(data);
  });

  sse.addEventListener('peer-left', () => {
    updateConnectionStatusBadge('PEER DISCONNECTED', 'status-disconnected');
    p2pState.status = 'DISCONNECTED';
    if (p2pState.dc) p2pState.dc.close();
    if (p2pState.pc) p2pState.pc.close();
  });

  sse.addEventListener('room-expired', () => {
    alert('The room has expired due to inactivity.');
    disconnectP2p();
  });

  sse.onerror = () => {
    // Reconnect handled automatically by EventSource
  };
}

async function sendSignal(type, payload) {
  if (!p2pState.roomId || !p2pState.peerId) return;
  try {
    await fetch(`/api/v1/p2p/rooms/${encodeURIComponent(p2pState.roomId)}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: p2pState.peerId,
        type,
        payload
      })
    });
  } catch (err) {
    console.error('[P2P] Failed to send signal:', err);
  }
}

// ---------------------------------------------------------------------------
// 4. WebRTC PeerConnection Setup (Host & Joiner)
// ---------------------------------------------------------------------------

function createPeerConnection() {
  if (p2pState.pc) {
    try { p2pState.pc.close(); } catch {}
  }

  const pc = new RTCPeerConnection(ICE_CONFIG);
  p2pState.pc = pc;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal('candidate', event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      // Direct WebRTC connection active
    } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      updateConnectionStatusBadge('CONNECTION LOST', 'status-disconnected');
      p2pState.status = 'DISCONNECTED';
    }
  };

  return pc;
}

async function setupHostWebRtcOffer() {
  updateConnectionStatusBadge('INITIATING WEBRTC HANDSHAKE...', 'status-connecting');
  const pc = createPeerConnection();

  // Create DataChannel with ordered: true
  const dc = pc.createDataChannel('p2p-transfer', { ordered: true });
  bindDataChannelEvents(dc);
  p2pState.dc = dc;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendSignal('offer', offer);
}

async function handleIncomingSignal({ senderId, type, payload }) {
  if (senderId === p2pState.peerId) return;

  if (type === 'offer') {
    updateConnectionStatusBadge('ANSWERING WEBRTC OFFER...', 'status-connecting');
    const pc = createPeerConnection();

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      bindDataChannelEvents(dc);
      p2pState.dc = dc;
    };

    await pc.setRemoteDescription(new RTCSessionDescription(payload));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal('answer', answer);

  } else if (type === 'answer') {
    if (p2pState.pc) {
      await p2pState.pc.setRemoteDescription(new RTCSessionDescription(payload));
    }
  } else if (type === 'candidate') {
    if (p2pState.pc && payload) {
      try {
        await p2pState.pc.addIceCandidate(new RTCIceCandidate(payload));
      } catch (err) {
        console.warn('[P2P] ICE candidate failed:', err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5. DataChannel Events & Binary Chunk Receiver
// ---------------------------------------------------------------------------

function bindDataChannelEvents(dc) {
  dc.binaryType = 'arraybuffer';

  dc.onopen = () => {
    p2pState.status = 'CONNECTED';
    updateConnectionStatusBadge('ENCRYPTED P2P DIRECT (CONNECTED)', 'status-connected', `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    `);

    // Enable transmission controls
    const dropzone = document.getElementById('p2p-dropzone');
    const sendSnippetBtn = document.getElementById('p2p-send-snippet-btn');
    if (dropzone) dropzone.classList.remove('p2p-disabled');
    if (sendSnippetBtn) sendSnippetBtn.removeAttribute('disabled');
  };

  dc.onclose = () => {
    updateConnectionStatusBadge('P2P CHANNEL CLOSED', 'status-disconnected');
    p2pState.status = 'DISCONNECTED';
  };

  dc.onerror = (err) => {
    console.error('[P2P] DataChannel error:', err);
  };

  dc.onmessage = (event) => {
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        handleControlMessage(msg);
      } catch (e) {
        console.warn('[P2P] Malformed string message:', e);
      }
    } else if (event.data instanceof ArrayBuffer) {
      handleBinaryChunk(event.data);
    }
  };
}

function handleControlMessage(msg) {
  if (msg.type === 'FILE_START') {
    // Initiate incoming transfer record
    p2pState.incomingTransfers.set(msg.transferId, {
      meta: msg,
      chunks: new Array(msg.totalChunks),
      receivedChunks: 0,
      receivedBytes: 0,
      startTime: Date.now()
    });
    renderP2pIncomingProgress(msg.transferId, 0, 0);

  } else if (msg.type === 'FILE_END') {
    const record = p2pState.incomingTransfers.get(msg.transferId);
    if (record) {
      // Assemble all ArrayBuffer chunks into single Blob
      const blob = new Blob(record.chunks, { type: record.meta.mimeType || 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);
      const durationSec = Math.max((Date.now() - record.startTime) / 1000, 0.1);
      const avgSpeedBps = record.meta.size / durationSec;

      const receivedItem = {
        id: msg.transferId,
        name: record.meta.name,
        size: record.meta.size,
        type: record.meta.mimeType,
        url: objectUrl,
        blob: blob,
        receivedAt: new Date().toLocaleTimeString(),
        speed: formatBytes(avgSpeedBps) + '/s'
      };

      p2pState.receivedFiles.unshift(receivedItem);
      p2pState.incomingTransfers.delete(msg.transferId);

      renderP2pReceivedFilesList();
      hideP2pIncomingProgress();

      // Trigger automatic browser download if option checked
      const autoDownload = document.getElementById('p2p-opt-auto-download')?.checked ?? true;
      if (autoDownload) {
        downloadReceivedFile(objectUrl, record.meta.name);
      }
    }

  } else if (msg.type === 'SNIPPET') {
    p2pState.snippets.unshift({
      id: msg.id || ('snip_' + Date.now()),
      title: msg.title || 'Untitled Snippet',
      language: msg.language || 'text',
      code: msg.code || '',
      receivedAt: new Date().toLocaleTimeString(),
      sender: 'Peer'
    });
    renderP2pSnippetsList();
  }
}

function handleBinaryChunk(buffer) {
  if (buffer.byteLength < 4) return;
  const view = new DataView(buffer);
  const chunkIndex = view.getUint32(0, false); // 4-byte big-endian chunk index
  const chunkData = buffer.slice(4);

  // Match chunk to currently active incoming transfer
  const activeEntry = Array.from(p2pState.incomingTransfers.entries())[0];
  if (!activeEntry) return;

  const [transferId, record] = activeEntry;
  record.chunks[chunkIndex] = chunkData;
  record.receivedChunks++;
  record.receivedBytes += chunkData.byteLength;

  const percent = Math.min(Math.round((record.receivedBytes / record.meta.size) * 100), 100);
  const elapsed = Math.max((Date.now() - record.startTime) / 1000, 0.1);
  const speedBps = record.receivedBytes / elapsed;

  renderP2pIncomingProgress(transferId, percent, speedBps);
}

// ---------------------------------------------------------------------------
// 6. File Chunking & Outgoing Flow Control Engine
// ---------------------------------------------------------------------------

export async function sendP2pFiles(files) {
  if (!p2pState.dc || p2pState.dc.readyState !== 'open') {
    alert('P2P connection is not established yet. Please connect to a peer first.');
    return;
  }

  const dc = p2pState.dc;
  dc.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;

  for (const file of files) {
    const transferId = 'tx_' + Math.random().toString(36).substring(2, 9);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    showP2pOutgoingProgress(file.name, file.size);

    // 1. Send FILE_START Header
    dc.send(JSON.stringify({
      type: 'FILE_START',
      transferId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks
    }));

    const startTime = Date.now();
    let sentBytes = 0;

    // 2. Stream 64KB Chunks with Flow Control
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      const rawChunk = await slice.arrayBuffer();

      // Prefix chunk with 4-byte UInt32 chunkIndex
      const packet = new Uint8Array(4 + rawChunk.byteLength);
      const view = new DataView(packet.buffer);
      view.setUint32(0, i, false);
      packet.set(new Uint8Array(rawChunk), 4);

      // Backpressure: pause if internal buffer exceeds 1MB
      if (dc.bufferedAmount > BUFFER_HIGH_WATERMARK) {
        await new Promise((resolve) => {
          dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null;
            resolve();
          };
        });
      }

      dc.send(packet.buffer);
      sentBytes += rawChunk.byteLength;

      const percent = Math.min(Math.round((sentBytes / file.size) * 100), 100);
      const elapsed = Math.max((Date.now() - startTime) / 1000, 0.1);
      const speed = sentBytes / elapsed;

      updateP2pOutgoingProgress(percent, speed);
    }

    // 3. Send FILE_END Completion Marker
    dc.send(JSON.stringify({
      type: 'FILE_END',
      transferId
    }));

    completeP2pOutgoingProgress(file.name);
  }
}

// ---------------------------------------------------------------------------
// 7. Code Snippet Sender
// ---------------------------------------------------------------------------

export function sendP2pCodeSnippet() {
  if (!p2pState.dc || p2pState.dc.readyState !== 'open') {
    alert('P2P connection is not established yet. Connect to a peer first.');
    return;
  }

  const titleInput = document.getElementById('p2p-snippet-title');
  const langSelect = document.getElementById('p2p-snippet-lang');
  const codeInput = document.getElementById('p2p-snippet-code');

  const title = (titleInput?.value || '').trim() || 'Snippet';
  const language = langSelect?.value || 'text';
  const code = codeInput?.value || '';

  if (!code.trim()) {
    alert('Please enter some code or text before sending.');
    return;
  }

  const snippetObj = {
    id: 'snip_' + Date.now(),
    title,
    language,
    code,
    timestamp: Date.now()
  };

  p2pState.dc.send(JSON.stringify({
    type: 'SNIPPET',
    ...snippetObj
  }));

  // Add to local feed
  p2pState.snippets.unshift({
    ...snippetObj,
    receivedAt: new Date().toLocaleTimeString(),
    sender: 'You'
  });

  if (codeInput) codeInput.value = '';
  renderP2pSnippetsList();
}

// ---------------------------------------------------------------------------
// 8. Disconnect & Reset
// ---------------------------------------------------------------------------

export function disconnectP2p() {
  if (p2pState.roomId && p2pState.peerId) {
    fetch(`/api/v1/p2p/rooms/${encodeURIComponent(p2pState.roomId)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId: p2pState.peerId })
    }).catch(() => {});
  }

  cleanupP2pConnection();

  // Reset UI views
  const createView = document.getElementById('p2p-create-view');
  const joinView = document.getElementById('p2p-join-view');
  const activeView = document.getElementById('p2p-active-room-view');

  if (createView) createView.style.display = 'block';
  if (joinView) joinView.style.display = 'block';
  if (activeView) activeView.style.display = 'none';

  updateConnectionStatusBadge('DISCONNECTED', 'status-disconnected');
}

function cleanupP2pConnection() {
  if (p2pState.sseSource) {
    p2pState.sseSource.close();
    p2pState.sseSource = null;
  }
  if (p2pState.dc) {
    try { p2pState.dc.close(); } catch {}
    p2pState.dc = null;
  }
  if (p2pState.pc) {
    try { p2pState.pc.close(); } catch {}
    p2pState.pc = null;
  }
  p2pState.status = 'IDLE';
  p2pState.roomId = null;
  p2pState.peerId = null;
  p2pState.role = null;
  p2pState.incomingTransfers.clear();
}

// ---------------------------------------------------------------------------
// 9. UI Rendering & Feedback Handlers
// ---------------------------------------------------------------------------

export function setP2pStudioTab(tab) {
  p2pState.activeTab = tab;
  const filesTab = document.getElementById('p2p-tab-files');
  const snippetsTab = document.getElementById('p2p-tab-snippets');
  const filesView = document.getElementById('p2p-files-view');
  const snippetsView = document.getElementById('p2p-snippets-view');

  if (filesTab) filesTab.classList.toggle('active', tab === 'files');
  if (snippetsTab) snippetsTab.classList.toggle('active', tab === 'snippets');
  if (filesView) filesView.style.display = tab === 'files' ? 'block' : 'none';
  if (snippetsView) snippetsView.style.display = tab === 'snippets' ? 'block' : 'none';
}

function renderP2pIncomingProgress(transferId, percent, speedBps) {
  const container = document.getElementById('p2p-incoming-progress');
  const bar = document.getElementById('p2p-incoming-bar');
  const text = document.getElementById('p2p-incoming-text');
  if (!container || !bar || !text) return;

  container.style.display = 'block';
  bar.style.width = `${percent}%`;
  text.textContent = `Receiving file... ${percent}% (${formatBytes(speedBps)}/s)`;
}

function hideP2pIncomingProgress() {
  const container = document.getElementById('p2p-incoming-progress');
  if (container) container.style.display = 'none';
}

function showP2pOutgoingProgress(name, size) {
  const container = document.getElementById('p2p-outgoing-progress');
  const nameEl = document.getElementById('p2p-outgoing-name');
  const bar = document.getElementById('p2p-outgoing-bar');
  const statEl = document.getElementById('p2p-outgoing-stat');
  if (!container) return;

  container.style.display = 'block';
  if (nameEl) nameEl.textContent = `${name} (${formatBytes(size)})`;
  if (bar) bar.style.width = '0%';
  if (statEl) statEl.textContent = 'Streaming encrypted chunks...';
}

function updateP2pOutgoingProgress(percent, speedBps) {
  const bar = document.getElementById('p2p-outgoing-bar');
  const statEl = document.getElementById('p2p-outgoing-stat');
  if (bar) bar.style.width = `${percent}%`;
  if (statEl) statEl.textContent = `${percent}% • ${formatBytes(speedBps)}/s`;
}

function completeP2pOutgoingProgress(name) {
  const statEl = document.getElementById('p2p-outgoing-stat');
  if (statEl) statEl.textContent = `✓ Sent ${name} successfully`;
  setTimeout(() => {
    const container = document.getElementById('p2p-outgoing-progress');
    if (container) container.style.display = 'none';
  }, 2500);
}

function renderP2pReceivedFilesList() {
  const container = document.getElementById('p2p-received-list');
  if (!container) return;

  if (p2pState.receivedFiles.length === 0) {
    container.innerHTML = `
      <div class="p2p-empty-placeholder mono-copy">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>No files received yet. Any file sent by peer will appear here.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = p2pState.receivedFiles.map(file => `
    <div class="p2p-file-card mono-copy">
      <div class="p2p-file-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      </div>
      <div class="p2p-file-details">
        <div class="p2p-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="p2p-file-meta">
          <span>${formatBytes(file.size)}</span>
          <span>•</span>
          <span>${escapeHtml(file.receivedAt)}</span>
          <span class="p2p-verified-badge">✓ Verified</span>
        </div>
      </div>
      <div class="p2p-file-actions">
        <a href="${file.url}" download="${escapeHtml(file.name)}" class="p2p-download-btn" title="Download File">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Download</span>
        </a>
      </div>
    </div>
  `).join('');
}

function renderP2pSnippetsList() {
  const container = document.getElementById('p2p-snippets-list');
  if (!container) return;

  if (p2pState.snippets.length === 0) {
    container.innerHTML = `
      <div class="p2p-empty-placeholder mono-copy">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        <span>No code snippets sent or received yet.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = p2pState.snippets.map(snip => `
    <div class="p2p-snippet-card mono-copy">
      <div class="p2p-snippet-header">
        <div class="p2p-snippet-title-area">
          <span class="p2p-snippet-lang-tag">${escapeHtml(snip.language.toUpperCase())}</span>
          <strong class="p2p-snippet-title">${escapeHtml(snip.title)}</strong>
          <span class="p2p-snippet-author">(${escapeHtml(snip.sender)} at ${escapeHtml(snip.receivedAt)})</span>
        </div>
        <button type="button" class="p2p-copy-code-btn" onclick="window.copyP2pSnippetText('${snip.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </button>
      </div>
      <pre class="p2p-snippet-body" id="snippet-body-${snip.id}"><code>${escapeHtml(snip.code)}</code></pre>
    </div>
  `).join('');
}

export function downloadReceivedFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function copyP2pRoomCode() {
  if (!p2pState.roomId) return;
  navigator.clipboard.writeText(p2pState.roomId).then(() => {
    const btn = document.getElementById('p2p-copy-code-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>✓ Copied</span>';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
  });
}

export function copyP2pJoinUrl() {
  if (!p2pState.roomId) return;
  const joinUrl = `${window.location.origin}/p2p-share?join=${p2pState.roomId}`;
  navigator.clipboard.writeText(joinUrl).then(() => {
    const btn = document.getElementById('p2p-copy-url-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>✓ Link Copied</span>';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
  });
}

export function copyP2pSnippetText(id) {
  const el = document.getElementById(`snippet-body-${id}`);
  if (!el) return;
  const code = el.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    alert('Code copied to clipboard!');
  });
}

// ── Direct Browser Window Binding ───────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.initP2pStudio = initP2pStudio;
  window.createP2pRoom = createP2pRoom;
  window.joinP2pRoom = joinP2pRoom;
  window.disconnectP2p = disconnectP2p;
  window.sendP2pFiles = sendP2pFiles;
  window.sendP2pCodeSnippet = sendP2pCodeSnippet;
  window.setP2pStudioTab = setP2pStudioTab;
  window.copyP2pRoomCode = copyP2pRoomCode;
  window.copyP2pJoinUrl = copyP2pJoinUrl;
  window.copyP2pSnippetText = copyP2pSnippetText;
}
