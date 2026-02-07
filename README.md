# SecureVault: Neural Sanctuary 🛡️🧠

SecureVault is a high-security, AI-enhanced notes application designed as a private sanctuary for your most important thoughts. Built with a focus on **privacy**, **premium aesthetics**, and **cognitive augmentation**, SecureVault transforms simple note-taking into a secure neural workspace.

## 🌟 Key Features

- **Encrypted Thoughts**: Every note is stored securely with strict ownership controls (IDOR protection).
- **Neural Taxonomy**: Automatically categorize your cognitive dumps using AI-generated tags (Neural Tags).
- **Neural Chat**: Interact directly with your notes via an integrated AI sidepanel. Ask questions, summarize, or brainstorm ideas based on your specific note content.
- **Transactional Credit System**: A server-side, atomic credit system ensures fair use of premium AI resources with a full audit ledger.
- **Fortified Security**:
    - Multi-layered Rate Limiting (Brute-force protection).
    - Zod Validation (Input sanitization).
    - 401 Session Auto-Termination.
    - SQL Injection certified immunity.
- **Premium UX**: A glassmorphic, dark-mode interface with smooth micro-animations and responsive design.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (React), TailwindCSS, Lucide Icons.
- **Backend**: Express.js, Node.js.
- **Persistence**: Prisma ORM, SQLite (Dev) / PostgreSQL (Prod).
- **Security**: JWT, Argon2, Helmet, Express-Rate-Limit.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/hefeholuwa/secure-notes-vault.git
cd secure-notes-vault
npm install
cd frontend && npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secure_random_secret"
BYTEZ_API_KEY="your_ai_service_key"
FRONTEND_URL="http://localhost:3001"
PORT=3000
```

### 3. Database Initialization
```bash
npx prisma migrate dev
```

### 4. Run Development
```bash
# In the root (Backend)
npm run dev

# In another terminal (Frontend)
cd frontend
npm run dev
```

## 🌐 Hosting

SecureVault is architected for modern cloud platforms:
- **Backend/DB**: Optimized for [Render](https://render.com) (Node.js + PostgreSQL).
- **Frontend**: Best hosted on [Vercel](https://vercel.com).

## 🛡️ Security Policy
SecureVault assumes a zero-trust model. All client inputs are validated server-side, and database interactions are strictly scoped to the authenticated user.

---
*Created with focus on Stability, Correctness, and Premium Vibecoding.*
