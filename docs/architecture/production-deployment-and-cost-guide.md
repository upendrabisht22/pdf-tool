# PRODUCTION DEPLOYMENT & COST ARCHITECTURE GUIDE
**Document Utility & Infrastructure Platform**

*Target Environment: Production Zero-Cost ($0/mo) to Ultra-Low-Cost (<$5/mo) Bootstrap Setup*  
*Storage Architecture: Cloudflare R2 (Zero Egress, Auto-Purging TTL)*  
*Compute Architecture: Hybrid Local-First (85% Browser-Side) + Sandboxed Ephemeral Workers (15% Server-Side)*

---

## 1. THE 85% VS. 15% WORKLOAD DIVISION

Our architecture intentionally splits document operations into two distinct execution tiers to keep infrastructure bills at or near **$0.00**.

```text
                      ┌───────────────────────────────────────────────┐
                      │             ALL USER REQUESTS                 │
                      └──────────────────────┬────────────────────────┘
                                             │
                      ┌──────────────────────┴────────────────────────┐
                      ▼                                               ▼
         [ 85% LOCAL-FIRST TIER ]                        [ 15% SERVER-ASSISTED TIER ]
         Execution: User Browser RAM                     Execution: Ephemeral Worker Sandbox
         Cloud Storage: 0 Bytes                          Cloud Storage: Cloudflare R2 (15-min TTL)
         Cloud Compute: $0.00                            Cloud Compute: $0.00 Free Tier or $4/mo VPS
         Bandwidth: $0.00                                Bandwidth: $0.00 (Cloudflare Zero-Egress)
```

### Tier A: The 85% Local-First Features ($0.00 / Month Forever)
These tools execute **100% inside the user's browser** via client-side WebAssembly, HTML5 Canvas, and `pdf-lib`:
- **Visual PDF Editor Studio** (text overlay, seamless paper-tone whiteout, image placement, freehand ink, stamps)
- **Crop & Resize PDF Studio** (margin trimming, standard A4/Letter sizing, live vector preview canvas)
- **Core Document Operations** (Merge, Split, Rotate, Compress, Reorder, Delete Pages, Extract Pages)
- **Document Utilities** (Watermark, Password Protect, Unlock, Flatten, Metadata Stripping)
- **Smart Business Studios** (GST Tax Invoices with UPI QR, 80mm POS Thermal Slips, 80G Tax Exemption Receipts, Commercial Proposals)
- **Signatures** (Canvas drawing pad, image compression under 30 KB)
- **AI Intelligence** (Grounded Q&A, Summaries, Table Extraction via Bring Your Own Key / BYOK using free Gemini API)

> **Cost Impact**: Even with 10,000,000 monthly visitors using Tier A tools, your cloud server bill is **$0.00** because your servers never touch or process these documents.

---

### Tier B: The Remaining 15% Server-Assisted Features
These tools require native compiled binaries (LibreOffice, Python `pdf2docx`, Tesseract C++ OCR) that are too large (200MB–500MB) to bundle into a lightweight mobile browser:
1. **Word to PDF** (`.docx` $\rightarrow$ `.pdf`) via LibreOffice headless.
2. **Excel to PDF** (`.xlsx` $\rightarrow$ `.pdf`) via LibreOffice headless.
3. **PowerPoint to PDF** (`.pptx` $\rightarrow$ `.pdf`) via LibreOffice headless.
4. **PDF to Word** (`.pdf` $\rightarrow$ `.docx`) via Python `pdf2docx`.
5. **PDF to Excel** (`.pdf` $\rightarrow$ `.xlsx`) via Python structured tabular extraction.
6. **OCR PDF** (scanned images $\rightarrow$ searchable sandwich PDF) via Tesseract OCR.
7. **Complex AI Table Scraping** (multipage challans and financial tables to CSV).

---

## 2. PRODUCTION COST ESTIMATION FOR THE 15% TIER

### 1. Storage & Bandwidth: Cloudflare R2
- **Storage Price**: 10 GB free every month forever ($0.015/GB thereafter).
- **Egress / Download Bandwidth**: **$0.00 forever** (Cloudflare charges zero egress fees, unlike AWS S3 which charges $0.09/GB).
- **Class A Writes**: 1,000,000 free operations/month.
- **Class B Reads**: 10,000,000 free operations/month.

#### How We Keep Storage at $0.00 (The 15-Minute Concurrency Math)
Documents in Tier B are temporary artifacts. By configuring a **15–30 minute Auto-Purge TTL rule**:
- If 1,000 users convert Word/Excel files per day (average size 2 MB):
  - Total data passing through daily = 2 GB.
  - However, at any single 15-minute slice, only 5 to 10 files exist concurrently in the bucket.
  - **Active concurrent storage in R2 = 10 MB – 50 MB!**
  - You will use less than **0.5% of your 10 GB free allowance**.
  - **Monthly Storage Bill: $0.00**.

### 2. Compute / Server CPU
To run Node.js and the Python/LibreOffice worker binaries:

| Hosting Option | Specs | Monthly Cost | Best Suited For |
| :--- | :--- | :--- | :--- |
| **Oracle Cloud Always-Free Tier** | 4 ARM Ampere Cores, 24 GB RAM, 200 GB SSD | **$0.00 / month** *(Free Forever)* | Best bootstrap choice. Zero cost, massive capacity for 100,000+ conversions/mo. |
| **Render.com / Fly.io Free Tiers** | 0.5 – 1 vCPU, 512MB – 1GB RAM | **$0.00 / month** | Good for early hobbyist testing (spins down after inactivity). |
| **Hetzner Cloud VPS (CPX11)** | 2 vCPU, 2 GB RAM, 40 GB NVMe | **~$4.00 / month** (€3.80) | High speed, dedicated resources, handles 50,000 conversions/mo. |
| **DigitalOcean / Linode Droplet** | 1 vCPU, 1 GB – 2 GB RAM | **$4.00 – $6.00 / month** | Standard reliable cloud VPS. |

> **Conclusion**: If you host on **Oracle Cloud Free Tier + Cloudflare R2**, your total platform bill is **$0.00/month**. If you choose a budget VPS on Hetzner, your bill is capped at **~$4.00/month**.

---

## 3. STEP-BY-STEP PRODUCTION DEPLOYMENT SETUP

### Step 1: Set Up Cloudflare R2 (Object Storage)
1. Sign up for a free account at [cloudflare.com](https://dash.cloudflare.com).
2. In the sidebar, navigate to **R2 Storage** $\rightarrow$ **Create Bucket**.
3. Name your bucket (e.g. `docplatform-prod-storage`).
4. **Configure Automated 24-Hour Auto-Purge (Zero-Cost Hygiene)**:
   - Inside your bucket, click **Settings** $\rightarrow$ **Lifecycle Rules** $\rightarrow$ **Add Rule**.
   - Rule Name: `auto-delete-ephemeral-documents`.
   - Action: `Delete objects`.
   - Age: `1 day` (or configure via worker hook for 15 minutes).
5. **Generate S3-Compatible API Credentials**:
   - Go to **R2** $\rightarrow$ **Manage R2 API Tokens** $\rightarrow$ **Create API Token**.
   - Permissions: `Object Read & Write`.
   - Copy:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`
     - `Bucket Name`

### Step 2: Configure Environment Variables
Create a production `.env` file on your server (never commit to git):

```bash
# Server Port & Environment
NODE_ENV=production
PORT=3000

# Storage Provider (Swap from local to Cloudflare R2)
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=docplatform-prod-storage
R2_PUBLIC_DOMAIN=https://storage.docplatform.app

# Job TTL (Auto-cleanup timeout in seconds: 1800s = 30 minutes)
JOB_CLEANUP_TTL_SECONDS=1800

# Optional BYOK Default Fallback (Users normally provide their own key in localStorage)
GEMINI_API_KEY=
```

### Step 3: Install Production OS Dependencies
On your Linux server (Ubuntu/Debian), install the conversion engines:

```bash
# Update package repositories
sudo apt-get update && sudo apt-get install -y \
  curl \
  git \
  build-essential \
  python3 \
  python3-pip \
  python3-venv \
  libreoffice-writer-nogpu \
  libreoffice-calc-nogpu \
  tesseract-ocr \
  tesseract-ocr-eng

# Install Python conversion dependencies in virtual environment
python3 -m venv /opt/docplatform-venv
source /opt/docplatform-venv/bin/activate
pip install --upgrade pip
pip install pdf2docx openpyxl pandas
```

### Step 4: Deploy & Run with PM2 (Process Manager)
```bash
# Clone repository
git clone https://github.com/upendrabisht22/pdf-tool.git /var/www/docplatform
cd /var/www/docplatform

# Install production dependencies and build packages
npm ci
npm run build

# Install PM2 globally
sudo npm install -g pm2

# Start server under PM2 with automatic restart on crash or reboot
pm2 start apps/web/server.js --name "docplatform-web"
pm2 startup
pm2 save
```

### Step 5: Configure Free Cloudflare DNS & SSL (HTTPS)
1. Point your domain DNS (e.g. `docplatform.app`) to Cloudflare nameservers.
2. Add an `A` record pointing to your server IP with the **Orange Cloud (Proxied)** enabled.
3. In Cloudflare Dashboard, set **SSL/TLS encryption mode** to **Full (Strict)**.
4. Cloudflare provides:
   - Free SSL/TLS certificates (automatic renewal).
   - Global CDN edge caching for all static assets (`styles.css`, JS modules, icons).
   - Enterprise-grade DDoS protection against HTTP floods.
   - Zero egress fees between Cloudflare Edge and Cloudflare R2.

---

## 4. ARCHITECTURAL SUMMARY FOR BOOTSTRAPPED FOUNDERS

1. **Zero Bandwidth Costs**: Cloudflare R2 + Cloudflare CDN completely eliminates the bandwidth bill that bankrupts traditional PDF SaaS tools.
2. **Zero Permanent Storage Liability**: Because files auto-purge within 15–30 minutes, your active disk footprint stays under 100MB–300MB, permanently residing inside Cloudflare's 10 GB free tier.
3. **Zero AI Token Liability**: By implementing Bring Your Own Key (BYOK) for Gemini AI, your users enjoy advanced AI document summarization while your company pays **$0.00 for LLM inference**.
4. **Maximum Privacy Guarantee**: 85% of features never upload bytes to the cloud, giving your product an authentic, unassailable privacy edge over corporate competitors like Adobe and Smallpdf.
