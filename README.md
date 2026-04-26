# HireSense AI — Talent Scouting & Engagement Agent

> **AI-powered recruiter tool that parses job descriptions, discovers matching candidates, simulates outreach conversations, and produces a dual-scored ranked shortlist.**

Built for the **AI-Powered Talent Scouting & Engagement Agent** hackathon challenge.

---

## What It Does

Recruiters spend hours sifting through profiles and chasing candidate interest. HireSense AI eliminates that by doing three things automatically:

1. **Parses a job description** → extracts required skills, experience level, and role title using AI (Mistral-7B via OpenRouter) with a smart keyword fallback
2. **Discovers and ranks candidates** → scores each candidate on two independent dimensions: Skill Match and Interest Level, then combines them into a Final Score
3. **Simulates outreach conversations** → lets recruiters chat with candidates to assess genuine interest, which dynamically updates the candidate's Interest Score and re-ranks the shortlist in real time

---

## Live Demo Flow

```
Paste JD  →  Analyze  →  Browse ranked candidates  →  Open profile  →  Start outreach  →  Chat  →  Interest score updates  →  Shortlist  →  Export CSV
```

---

## Features

### JD Parsing
- AI extracts required skills, experience, and role title from free-text job descriptions
- Smart fallback parser with 40+ role/stack aliases (MERN, DevOps, Full Stack, etc.) when AI is unavailable
- Extracted skills displayed as tags for full transparency

### Candidate Discovery & Matching (with Explainability)
- Pool of 200 auto-generated candidates with realistic Indian tech profiles
- **Primary-skill weighted scoring** — the core required skill carries 65% base weight, preventing dilution from secondary skills
- Matched and missing skills shown per candidate for full explainability
- Filters: All / Strong Hire / Potential / Actively Looking / AI Assessed

### Dual-Dimension Scoring
| Dimension | Weight | How It's Computed |
|-----------|--------|-------------------|
| Match Score | 55% | Primary skill weighting + experience proximity bonus |
| Interest Score | 45% | Profile-based initially; updated live from conversation |
| **Final Score** | 100% | `0.55 × Match + 0.45 × Interest` |

### Recommendation Labels
| Score | Label |
|-------|-------|
| 80–100 | Strong Hire |
| 60–79 | Potential Hire |
| 40–59 | Consider |
| 0–39 | Weak Match |

### Conversational Outreach Simulation
- Each candidate is simulated as an AI persona that responds in character based on their interest level, skills, and availability
- Context-aware replies — if recruiter asks "are you comfortable with React?", the candidate answers about **React specifically**, not an unrelated skill
- Per-message interest scoring using keyword signal detection with regression smoothing
- Live Interest bar updates after every candidate reply
- Interest score history shown as a mini sparkline chart

### Shortlist & Export
- Star any candidate to add to the shortlist
- Shortlist modal shows all candidates in a ranked table with both base and live interest scores
- One-click CSV export with all fields: name, role, scores, recommendation, contact details, availability

### AI Outreach Message Generator
- Generates a personalized 3-sentence recruiter message per candidate referencing their specific skills
- Regeneratable with one click

---

## Tech Stack

### Frontend
- **React** (Create React App)
- **Axios** for API calls
- CSS variables for theming (dark/light mode toggle)
- Custom SVG score rings, animated progress bars, live interest indicator

### Backend
- **Node.js + Express**
- **OpenRouter API** (Mistral-7B Instruct) for JD parsing, chat simulation, outreach generation
- Smart fallback mode — fully functional without an API key using rule-based logic
- Session-based chat history (per candidate per recruiter session)

### AI Model
- `mistralai/mistral-7b-instruct` via OpenRouter
- Used for: JD parsing, candidate persona responses, outreach message generation

---

## Project Structure

```
hiresense-ai/
├── backend/
│   └── index.js          # Express server — all routes and AI logic
├── frontend/
│   └── src/
│       ├── App.js         # Full React app — all UI components
│       ├── App.css        # Component styles
│       └── index.css      # Global theme variables and animations
├── .env                   # API key (not committed)
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm
- An OpenRouter API key (free tier works) — get one at [openrouter.ai](https://openrouter.ai)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hiresense-ai.git
cd hiresense-ai
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
OPENROUTER_API_KEY=sk-or-your-key-here
```

Start the server:

```bash
node index.js
# → 🚀 HireSense AI running on http://localhost:5000
```

> **No API key?** The app runs in smart fallback mode — JD parsing, candidate matching, chat simulation, and interest scoring all work without an AI key using rule-based logic.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm start
# → App opens at http://localhost:3001
```

---

## How Scoring Works

### Match Score (Skill Match)

The match score uses **primary skill weighting** to prevent score dilution.

```
If candidate has the PRIMARY skill (jdSkills[0]):
  matchScore = 65 + (otherMatchedSkills / otherJdSkills) × 35

If candidate is missing the primary skill:
  matchScore = min(50, proportional score)  ← capped at 50%
```

**Example:** JD = "React Developer" → skills extracted: `["React", "JavaScript"]`

| Candidate Skills | Match Score |
|-----------------|-------------|
| React, JavaScript | 100% |
| React, Node.js | 82% |
| React only | 65% |
| JavaScript only | 50% (capped, no primary skill) |
| Python, Django | 0% (not matched) |

Experience proximity adds up to +15 bonus points.

### Interest Score (Conversation-Driven)

Initial interest is set from the candidate's profile (`high=95, medium=70, low=40, none=10`).

Once a conversation starts, each candidate reply is analyzed for interest signals:

```
Strong positive signals  (+18): "actively looking", "excited", "sounds great"...
Moderate positive (+9):         "open to", "sounds promising", "happy to discuss"...
Moderate negative (-9):         "not actively", "depends on", "fairly settled"...
Strong negative (-18):          "not interested", "not looking", "happy where I am"...
```

A regression pull (15% toward prior) prevents runaway scores. The Interest Score updates in the ranked list **after every message**.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/candidates` | Returns pool stats (total, by interest level) |
| `POST` | `/analyze` | Parses JD, returns ranked candidate list |
| `POST` | `/chat` | Sends message to candidate persona, returns reply + live interest score |
| `POST` | `/outreach` | Generates personalized outreach message for a candidate |
| `POST` | `/shortlist/export` | Returns CSV of shortlisted candidates |

### POST /analyze — Request

```json
{
  "jd": "We are looking for a Senior React Developer with 4+ years experience in Node.js and AWS."
}
```

### POST /analyze — Response (per candidate)

```json
{
  "id": 12,
  "name": "Sneha Reddy",
  "matchScore": 82,
  "interestScore": 95,
  "finalScore": 88,
  "recommendation": "Strong Hire",
  "matchedSkills": ["React", "Node.js"],
  "missingSkills": ["AWS"],
  "skills": ["React", "Node.js", "TypeScript", "Docker"],
  "experience": 5,
  "location": "Bangalore",
  "availability": "Available in 30 days",
  "expectedSalary": "₹25-35 LPA",
  "interestLevel": "high",
  "response": "I am actively looking for new opportunities and excited about this role."
}
```

### POST /chat — Request

```json
{
  "message": "Are you comfortable with React?",
  "candidate": { "id": 12, "name": "Sneha Reddy", ... },
  "sessionId": "12_1714123456789"
}
```

### POST /chat — Response

```json
{
  "reply": "Absolutely — React has been central to my work for the last 4 years. Built production-grade dashboards and component libraries with it. Happy to go into specifics.",
  "conversationInterestScore": 87,
  "interestHistory": [
    { "turn": 1, "score": 87, "delta": 0 }
  ],
  "aiPowered": true
}
```

---

## Candidate Data

The system generates 200 candidates with realistic profiles on startup:

- **Names:** 50 first names × 30 last names (Indian tech professional names)
- **Skills:** Random 2–5 skills from a pool of 44 tech skills
- **Experience:** 1–12 years (role auto-assigned by range)
- **Colleges:** 14 Indian engineering colleges (IITs, NITs, private)
- **Locations:** 14 Indian tech cities
- **Interest profiles:** 5 realistic disposition templates

---

## Fallback Mode (No API Key)

All core features work without an OpenRouter API key:

| Feature | With API Key | Without API Key |
|---------|-------------|-----------------|
| JD Parsing | Mistral AI | Keyword + alias matching |
| Candidate Chat | Mistral AI (in character) | Context-aware rule-based replies |
| Outreach Message | Mistral AI | Template with candidate data |
| Scoring | Same | Same (no AI involved) |
| CSV Export | Same | Same |

The fallback chat system detects question intent (skills, salary, availability, interest, goals) and generates contextually appropriate replies referencing the specific skill or topic the recruiter asked about.

---

## Screenshots

| View | Description |
|------|-------------|
| Main dashboard | JD input + ranked candidate list + profile panel |
| Chat / Outreach | Live interest bar updates with every reply |
| Shortlist modal | Full ranked table with base + live interest + CSV export |

---

## Hackathon Challenge Requirements

| Requirement | Implementation |
|-------------|---------------|
| JD parsing | AI (Mistral) + smart keyword fallback with 40+ aliases |
| Candidate discovery and matching | Primary-skill weighted scoring against 200-candidate pool |
| Explainability | Matched/missing skills shown per candidate |
| Conversational outreach (simulated) | AI persona chat with session memory |
| Assess genuine interest | Per-message keyword scoring updates Interest Score live |
| Ranked shortlist on two dimensions | Match Score (55%) + Interest Score (45%) = Final Score |
| Recruiter can act on it immediately | Shortlist modal + one-click CSV export |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Optional | Your OpenRouter API key. App works without it. |

---

## License

MIT — free to use, modify, and distribute.

---

## Built With

- [React](https://react.dev)
- [Express](https://expressjs.com)
- [OpenRouter](https://openrouter.ai) + [Mistral AI](https://mistral.ai)
- Deployed locally — no external database required

---

*HireSense AI — making talent scouting smarter, one conversation at a time.*

Architechture diagram

[User / Recruiter UI (React)]
            ↓
   Enter Job Description
            ↓
[Frontend (React App)]
            ↓ API Call (/analyze)
[Backend (Node.js + Express)]
            ↓
   1. JD Parsing (skills extraction)
   2. Candidate Filtering (skill match)
   3. Scoring Engine
            ↓
   Ranked Candidates (Match + Interest)
            ↓
[Frontend Display]

-------------------------------------

(Chat Flow)

[Frontend Chat UI]
            ↓ API (/chat)
[Backend Chat Engine]
            ↓
[OpenRouter AI / Fallback Logic]
            ↓
Dynamic Candidate Response

Explanation :
Frontend (React) → collects JD and displays ranked candidates
Backend (Node.js) → handles logic, scoring, and filtering
AI Layer (OpenRouter) → simulates real candidate conversation
Scoring Engine → calculates match and interest scores
Session Memory → maintains chat history per candidate

Match Score (0–100)
Match Score = (Matched Skills / Required Skills) × 100

Example:
JD Skills: Java, Spring Boot
Candidate Skills: Java, React

→ Match = 1/2
→ Score = 50%


🔹 Interest Score (0–100)

Based on conversation response:

Response Type	Score
Actively looking	90–100
Open to opportunities	70–80
Neutral	50–60
Not interested	20–40
🔹 Final Score
Final Score = 0.6 × Match Score + 0.4 × Interest Score


SAMPLE INPUT
🔹 Job Description
Looking for a Java Developer with Spring Boot experience.
Must have backend development skills and REST API knowledge.

Ranked Candidates
✅ Candidate 1: Sneha 22
Match Score: 100
Interest Score: 90
Final Score: 96
Reason: Matched Skills → Java, Spring Boot
💬 Conversation
Recruiter: Are you open to this role?
Candidate: I am actively looking for new opportunitie
