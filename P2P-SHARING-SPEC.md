# DocPlatform P2P Zero-Login File & Code Sharing Specification
**Architecture, Protocol & Product Requirements Document (PRD)**
*Status: Permanent Project Specification (Phase 4 Roadmap Feature)*

---

## 1. Executive Summary & Problem Solved

### The Problem in College Labs & Restricted Workspaces
In university computer labs, exam centers, coding competitions, and strict enterprise intranet environments:
- **Blocked Communication Channels**: WhatsApp Web, Telegram, Discord, and personal emails are frequently blocked by firewall proxies or strictly prohibited by lab proctors.
- **Security & Privacy Risks on Shared PCs**: Logging into Google Drive, OneDrive, or personal email leaves persistent session tokens, browser history, and autofill credentials on shared computers accessible to subsequent students.
- **Ad-Hoc Transfer Friction**: Passing quick code snippets (C++, Python, Java, SQL), assignment PDFs, or screenshots between neighboring workstations or from a lab PC to a student's personal phone is notoriously cumbersome, often leading to insecure flash drive sharing (malware vectors).

### The Solution: Zero-Login WebRTC P2P Transfer (`/p2p-share`)
**DocPlatform P2P Share** enables instant, browser-to-browser, encrypted peer-to-peer file and code sharing:
- **No Sign-Up / No Account**: Operates purely anonymously.
- **Zero Cloud Storage**: Files stream in real-time directly through an encrypted **WebRTC `RTCDataChannel`**; no bytes ever touch or reside on any server disk or cloud bucket.
- **Instant Pairing via QR or 6-Digit Room Code**: Scan a dynamic QR code using a phone camera or type a friendly 6-digit code (e.g. `LAB-402`) on a neighboring PC to immediately bridge the connection.
- **Bidirectional Support**: Share multi-megabyte files (PDFs, ZIPs, images) or paste text/code snippets with built-in syntax formatting and a 1-click copy button.

---

## 2. Core User Experience & Workflows

### Flow A: Lab PC to Personal Mobile (or Tablet)
1. Student opens `docplatform.app/p2p-share` on the lab workstation.
2. The workstation generates an ephemeral room (`LAB-881`) and renders an interactive pairing QR code on the screen.
3. The student points their smartphone camera at the QR code (no app download required; opens standard browser).
4. WebRTC handshake completes automatically in < 500ms.
5. The student drops their assignment PDF or clicks **Send Code Snippet** on the PC.
6. The file downloads directly into the phone's storage, and the lab session is wiped clean when the browser tab closes.

### Flow B: Workstation to Workstation (Lab PC 1 ➔ Lab PC 2)
1. Sender on PC 1 opens `/p2p-share` and clicks **"Create Room"** ➔ generates code `LAB-402`.
2. Receiver on PC 2 opens `/p2p-share`, clicks **"Join Room"**, and enters `LAB-402`.
3. Signaling establishes direct local network peering (mDNS / ICE candidates).
4. Sender selects files or types/pastes a code block.
5. Receiver sees real-time chunk progress bar and receives the assembled file with SHA-256 integrity verification.

---

## 3. Technical Architecture & Protocols

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│         Peer A (Sender)         │                 │        Peer B (Receiver)        │
│  - WebRTC RTCDataChannel        │                 │  - WebRTC RTCDataChannel        │
│  - 64KB ArrayBuffer Chunking    │                 │  - ArrayBuffer Assembly         │
│  - CRC32 / SHA-256 Checksum     │                 │  - File System Access / Blob    │
└────────────────┬────────────────┘                 └────────────────┬────────────────┘
                 │                                                   │
                 │ 1. Offer / Answer SDP Handshake                   │
                 ▼                                                   ▼
       ┌───────────────────────────────────────────────────────────────────┐
       │             DocPlatform Ephemeral Signaling Relay                 │
       │       (SSE / WebSocket - In-Memory Room Hub, 0 Data Storage)      │
       └───────────────────────────────────────────────────────────────────┘
                                         │
                   2. P2P Direct Connection Established
                   ◄───────────────────────────────────►
                     Encrypted SCTP over DTLS / UDP
```

### Signaling Layer (Lightweight & Ephemeral)
- **Protocol**: Ephemeral Server-Sent Events (SSE) or WebSocket channel scoped to a 6-character room token (`/[A-Z0-9]{3}-[A-Z0-9]{3}/`).
- **Data Exchanged**:
  - `offer`: WebRTC SDP description.
  - `answer`: Counterpart SDP description.
  - `candidate`: ICE candidate strings for NAT traversal.
- **Relay Lifetime**: As soon as the `RTCDataChannel` state transitions to `'open'`, the signaling connection is terminated to minimize server resource consumption. Rooms auto-expire after 5 minutes of inactivity.

### Data Transport Protocol
- **Transport**: WebRTC `RTCDataChannel` configured with:
  ```javascript
  const dataChannel = peerConnection.createDataChannel('fileTransfer', {
    ordered: true, // Guarantees chunk sequence delivery
  });
  ```
- **Chunking Engine**:
  - Chunk size: 64 KB (`65536` bytes) for maximum throughput without overwhelming browser buffer limits.
  - Flow Control: Monitors `dataChannel.bufferedAmount` to throttle chunk pushing when the internal buffer exceeds 1 MB, resuming on `bufferedamountlow`.
- **Packet Structure**:
  ```typescript
  interface FileHeaderPacket {
    type: 'FILE_HEADER';
    transferId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
    checksum: string; // SHA-256 or CRC32
  }

  interface FileChunkPacket {
    type: 'FILE_CHUNK';
    transferId: string;
    chunkIndex: number;
    data: ArrayBuffer;
  }
  ```

---

## 4. Security & Zero-Retention Threat Model

1. **End-to-End Encryption**: Direct browser connections are encrypted by default using standard DTLS (Datagram Transport Layer Security). Neither intermediate ISPs nor DocPlatform servers can inspect the payload.
2. **Zero Server Disk Write**: All file payloads exist solely in volatile client RAM. DocPlatform servers never buffer, cache, or persist transfer content.
3. **No Auth Token Residuals**: Public lab computers require no login credentials, cookies, or OAuth handshakes. Closing the browser tab terminates all state.
4. **Room Brute-Force Defense**: Ephemeral 6-character room codes are rate-limited to 5 incorrect attempts per IP before temporary throttling, preventing unauthorized room intrusion.

---

## 5. UI/UX Specifications (SaaS Dark Theme Compliance)

Following [`design-rules.md`](file:///c:/Users/Bhanu%20Bisht/pdf-tool/.agents/rules/design-rules.md):
- **Theme**: Dark Slate Canvas (`#0B0F17`) with glassmorphic cards (`rgba(17, 24, 39, 0.75)`), subtle borders (`border-white/10`), and glowing interactive accents (`#06b6d4` cyan / `#6366f1` indigo).
- **Typography**: Display headers in `Cabinet Grotesk`, body copy in `Plus Jakarta Sans`, code editors in `JetBrains Mono`.
- **Primary Modules**:
  1. **Pairing Hub**: Toggle between *Share Files* and *Receive Files*. Dynamic SVG QR code generator with high contrast dark mode styling.
  2. **Code Snippet Pad**: Monospace dark editor with quick language selector (JavaScript, Python, C++, SQL, Raw Text) and 1-click copy button.
  3. **File Transfer Dropzone**: Drag-and-drop zone supporting multiple files, live transfer speed gauges (MB/s), and real-time progress indicators.

---

## 6. Multi-Phase Implementation Roadmap

- [x] **Phase 1: Design System & Architecture Specification** (Persisted in `P2P-SHARING-SPEC.md`, Landing Page feature spotlight).
- [ ] **Phase 2: In-Memory Signaling Hub** (`/api/v1/p2p/signal` ephemeral SSE room coordinator in `server.js`).
- [ ] **Phase 3: Client WebRTC DataChannel Engine** (`public/modules/p2p-client.js` with chunking, flow-control, and auto-reconnect).
- [ ] **Phase 4: Dedicated Tool Studio (`/p2p-share`)** (Full visual interface with QR generation, code pad, and drag-and-drop file transfer).
