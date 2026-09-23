/**
 * @file views/studios/p2p-studio-view.js
 * @description Dedicated Zero-Login WebRTC P2P Air-Drop & Code Sharing studio view.
 */

/**
 * Renders the WebRTC P2P Air-Drop Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderP2pStudioView({ studioId }) {
  const isVisible = studioId === 'p2p-share-studio';
  return `
    <!-- Dedicated Zero-Login WebRTC P2P Sharing Studio -->
    <div id="p2p-share-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <div class="p2p-studio-container">
        
        <!-- 1. Top Pairing & Room Connection Banner -->
        <div class="p2p-card p2p-connection-card">
          <div class="p2p-connection-header">
            <div class="flex items-center gap-3">
              <div class="p2p-icon-glow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </div>
              <div>
                <h2 class="hero-display text-base font-bold text-text-primary tracking-tight">Zero-Login P2P Air-Drop</h2>
                <p class="mono-copy text-[11px] text-text-secondary">Direct browser-to-browser WebRTC encrypted transfer • Zero server storage</p>
              </div>
            </div>

            <!-- Status Pill -->
            <div id="p2p-status-badge" class="p2p-status-pill mono-copy status-disconnected">
              <span id="p2p-status-icon">
                <span class="p2p-dot"></span>
              </span>
              <span id="p2p-status-text">DISCONNECTED</span>
            </div>
          </div>

          <!-- Initial Room Setup View: Choice to Host or Join -->
          <div id="p2p-room-setup-grid" class="p2p-setup-grid mt-4">
            <!-- Host Card -->
            <div class="p2p-action-box" id="p2p-create-view">
              <div class="mono-copy text-[10px] text-accent uppercase tracking-wider mb-1">[ SHARE FROM THIS DEVICE ]</div>
              <h3 class="text-sm font-semibold text-text-primary mb-1">Create Ephemeral Room</h3>
              <p class="mono-copy text-xs text-text-secondary mb-3">Generate an ephemeral room code (e.g. LAB-402) & QR code for neighboring PCs or phone cameras to bridge.</p>
              <button type="button" class="paper-cta-btn group w-full justify-center" onclick="window.createP2pRoom()">
                <span class="cta-fill"></span>
                <span class="relative z-10 flex items-center justify-center gap-2 mono-copy text-xs uppercase font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Create New Room</span>
                </span>
              </button>
            </div>

            <!-- Join Card -->
            <div class="p2p-action-box" id="p2p-join-view">
              <div class="mono-copy text-[10px] text-[#10b981] uppercase tracking-wider mb-1">[ RECEIVE / CONNECT ]</div>
              <h3 class="text-sm font-semibold text-text-primary mb-1">Connect to Workstation</h3>
              <p class="mono-copy text-xs text-text-secondary mb-3">Enter the room code (e.g. LAB-402) shown on your other computer or whiteboard.</p>
              <div class="flex gap-2">
                <input type="text" id="p2p-join-input" placeholder="e.g. LAB-402" maxlength="10" class="mono-copy gst-input uppercase text-center font-bold tracking-widest text-sm" style="flex: 1;" onkeydown="if(event.key==='Enter') window.joinP2pRoom()" />
                <button type="button" class="paper-cta-btn group" style="padding: 0 1rem;" onclick="window.joinP2pRoom()">
                  <span class="cta-fill"></span>
                  <span class="relative z-10 mono-copy text-xs uppercase font-medium">Join</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Active Connected Room Control Bar (Hidden initially) -->
          <div id="p2p-active-room-view" class="p2p-active-room-bar mt-4" style="display: none;">
            <div class="flex flex-wrap items-center justify-between gap-4 w-full">
              <div class="flex items-center gap-3">
                <div>
                  <div class="mono-copy text-[10px] text-text-secondary">ACTIVE ROOM CODE</div>
                  <div class="mono-copy text-2xl font-black text-text-primary tracking-widest" id="p2p-active-room-code">LAB-000</div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" id="p2p-copy-code-btn" class="p2p-btn-secondary mono-copy text-xs" onclick="window.copyP2pRoomCode()" title="Copy Room Code">
                    <span>Copy Code</span>
                  </button>
                  <button type="button" id="p2p-copy-url-btn" class="p2p-btn-secondary mono-copy text-xs" onclick="window.copyP2pJoinUrl()" title="Copy Direct Join Link">
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              <!-- Pairing QR Code Flyout Container -->
              <div class="flex items-center gap-3">
                <div class="p2p-qr-wrapper" id="p2p-qr-wrapper">
                  <div id="p2p-qr-container" class="p2p-qr-container"></div>
                  <span class="mono-copy text-[10px] text-text-secondary block text-center mt-1">Scan with phone camera</span>
                </div>
                <button type="button" class="p2p-btn-danger mono-copy text-xs" onclick="window.disconnectP2p()">
                  <span>Leave Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Transfer Mode Tabs (Files vs Snippets) -->
        <div class="p2p-tabs-bar mt-4">
          <button type="button" id="p2p-tab-files" class="p2p-tab-btn active mono-copy" onclick="window.setP2pStudioTab('files')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Files & Documents</span>
          </button>
          <button type="button" id="p2p-tab-snippets" class="p2p-tab-btn mono-copy" onclick="window.setP2pStudioTab('snippets')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            <span>Code Snippet Pad</span>
          </button>
        </div>

        <!-- 3A. Files Section -->
        <div id="p2p-files-view" class="p2p-view-section mt-4">
          <!-- Dropzone for Files -->
          <div class="p2p-dropzone p2p-disabled mono-copy" id="p2p-dropzone" onclick="document.getElementById('p2p-file-input').click()">
            <input type="file" id="p2p-file-input" multiple style="display: none;" onchange="if(this.files.length) window.sendP2pFiles(this.files)" />
            <div class="p2p-dropzone-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div class="font-semibold text-text-primary text-sm mb-1">Drop Files to Stream to Peer</div>
            <div class="text-xs text-text-secondary max-w-sm">PDFs, lab assignments, ZIPs, photos, videos, or source code. Files stream in 64KB encrypted chunks directly to your peer.</div>
          </div>

          <!-- Outgoing Progress Bar -->
          <div id="p2p-outgoing-progress" class="p2p-progress-box mono-copy mt-3" style="display: none;">
            <div class="flex justify-between text-xs mb-1">
              <span id="p2p-outgoing-name" class="font-semibold text-text-primary truncate">Sending file...</span>
              <span id="p2p-outgoing-stat" class="text-text-secondary">0%</span>
            </div>
            <div class="p2p-progress-track">
              <div id="p2p-outgoing-bar" class="p2p-progress-bar outgoing"></div>
            </div>
          </div>

          <!-- Incoming Progress Bar -->
          <div id="p2p-incoming-progress" class="p2p-progress-box mono-copy mt-3" style="display: none;">
            <div class="flex justify-between text-xs mb-1">
              <span id="p2p-incoming-text" class="font-semibold text-text-primary">Receiving file from peer...</span>
            </div>
            <div class="p2p-progress-track">
              <div id="p2p-incoming-bar" class="p2p-progress-bar incoming"></div>
            </div>
          </div>

          <!-- Received Files Section -->
          <div class="mt-6">
            <div class="flex justify-between items-center mb-3">
              <span class="mono-copy text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span>Received Files</span>
                <span class="p2p-badge-count" id="p2p-received-count"></span>
              </span>
              <label class="mono-copy text-xs text-text-secondary flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="p2p-opt-auto-download" checked />
                <span>Auto-download to device</span>
              </label>
            </div>
            <div id="p2p-received-list" class="p2p-received-grid">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- 3B. Code Snippet Section -->
        <div id="p2p-snippets-view" class="p2p-view-section mt-4" style="display: none;">
          <div class="p2p-card p-4">
            <div class="flex flex-wrap gap-2 mb-3">
              <input type="text" id="p2p-snippet-title" placeholder="Snippet Title (e.g. lab_solution.cpp)" class="gst-input mono-copy text-xs" style="flex: 2; min-width: 180px;" />
              <select id="p2p-snippet-lang" class="select-control mono-copy text-xs" style="flex: 1; min-width: 120px;">
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="html">HTML / CSS</option>
                <option value="text">Plain Text</option>
              </select>
              <button type="button" id="p2p-send-snippet-btn" class="paper-cta-btn group" onclick="window.sendP2pCodeSnippet()" disabled>
                <span class="cta-fill"></span>
                <span class="relative z-10 flex items-center gap-2 mono-copy text-xs uppercase font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  <span>Send Snippet</span>
                </span>
              </button>
            </div>
            <textarea id="p2p-snippet-code" rows="8" placeholder="Paste your code snippet or assignment solution here... Delivered instantly into peer's clipboard/view." class="p2p-code-textarea mono-copy text-xs w-full"></textarea>
          </div>

          <!-- Feed of Snippets -->
          <div class="mt-6">
            <div class="mono-copy text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Code Snippets Stream</div>
            <div id="p2p-snippets-list" class="p2p-snippets-stream">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
