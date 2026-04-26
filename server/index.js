const express = require("express");
const cors    = require("cors");
require("dotenv").config();
const OpenAI  = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

let openai = null;
if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "https://hiresenseai-xp0u.onrender.com", "X-Title": "HireSense AI" }
  });
  console.log("✅ OpenRouter AI enabled");
} else {
  console.log("⚠️  No OPENROUTER_API_KEY — running in smart fallback mode");
}

const skillsPool = [
  "Java","Spring Boot","React","Node.js","Python","Django",
  "MongoDB","MySQL","PostgreSQL","AWS","Docker","Kubernetes",
  "TypeScript","GraphQL","Redis","Angular","Vue.js","Flutter",
  "Swift","Kotlin","Go","Rust","C++","PHP","Laravel",
  "TensorFlow","PyTorch","Machine Learning","Data Science",
  "Tableau","Power BI","Azure","GCP","Terraform","CI/CD",
  "Jenkins","Git","Linux","Elasticsearch","JavaScript","Express.js",
  "Next.js","REST API","Microservices","System Design"
];

// ═══════════════════════════════════════════════════════════════════
// TOPIC → SKILL MAP  (THE CORE FIX)
// When recruiter asks "experience in ai / cloud / backend / etc.",
// we map that natural-language topic to real skill names, then check
// which of those the candidate actually owns — so the reply ALWAYS
// references a skill the candidate truly has (or honestly admits lack).
// ═══════════════════════════════════════════════════════════════════
const topicSkillMap = [
  { topics: ["artificial intelligence","ai developer","ai engineer","ai"],
    skills:  ["TensorFlow","PyTorch","Machine Learning","Data Science","Python"] },
  { topics: ["machine learning","ml"],
    skills:  ["Machine Learning","TensorFlow","PyTorch","Python"] },
  { topics: ["deep learning"],
    skills:  ["TensorFlow","PyTorch","Machine Learning"] },
  { topics: ["data science","data scientist","analytics"],
    skills:  ["Data Science","Machine Learning","Python","Tableau","Power BI"] },
  { topics: ["nlp","natural language processing"],
    skills:  ["Python","TensorFlow","Machine Learning"] },
  { topics: ["computer vision"],
    skills:  ["Python","TensorFlow","PyTorch"] },
  { topics: ["generative ai","gen ai","llm"],
    skills:  ["Python","TensorFlow","PyTorch","Machine Learning"] },
  { topics: ["python"],
    skills:  ["Python","Django","TensorFlow","Machine Learning"] },
  { topics: ["django"],
    skills:  ["Django","Python"] },
  { topics: ["javascript","js"],
    skills:  ["JavaScript","TypeScript","Node.js","React"] },
  { topics: ["typescript","ts"],
    skills:  ["TypeScript","JavaScript","React","Node.js"] },
  { topics: ["react","react.js","reactjs"],
    skills:  ["React","TypeScript","JavaScript","Next.js"] },
  { topics: ["next.js","nextjs"],
    skills:  ["Next.js","React","TypeScript"] },
  { topics: ["angular"],
    skills:  ["Angular","TypeScript","JavaScript"] },
  { topics: ["vue","vue.js","vuejs"],
    skills:  ["Vue.js","JavaScript","TypeScript"] },
  { topics: ["frontend","front-end","front end","ui","ux"],
    skills:  ["React","Angular","Vue.js","TypeScript","JavaScript","Next.js"] },
  { topics: ["node","node.js","nodejs"],
    skills:  ["Node.js","Express.js","JavaScript","TypeScript"] },
  { topics: ["express","express.js"],
    skills:  ["Express.js","Node.js","JavaScript"] },
  { topics: ["backend","back-end","back end","server side"],
    skills:  ["Node.js","Java","Python","Django","Spring Boot","Express.js","Go"] },
  { topics: ["java","spring","spring boot"],
    skills:  ["Java","Spring Boot"] },
  { topics: ["full stack","fullstack","full-stack"],
    skills:  ["React","Node.js","JavaScript","TypeScript"] },
  { topics: ["mern"],
    skills:  ["MongoDB","Express.js","React","Node.js"] },
  { topics: ["mean"],
    skills:  ["MongoDB","Angular","Express.js","Node.js"] },
  { topics: ["database","db","sql","nosql"],
    skills:  ["MongoDB","MySQL","PostgreSQL","Redis","Elasticsearch"] },
  { topics: ["mongodb","mongo"],
    skills:  ["MongoDB"] },
  { topics: ["mysql"],
    skills:  ["MySQL","PostgreSQL"] },
  { topics: ["postgresql","postgres"],
    skills:  ["PostgreSQL","MySQL"] },
  { topics: ["redis"],
    skills:  ["Redis"] },
  { topics: ["cloud","cloud computing","cloud infrastructure"],
    skills:  ["AWS","Azure","GCP","Docker","Kubernetes"] },
  { topics: ["aws","amazon web services"],
    skills:  ["AWS","Docker","Kubernetes","Terraform"] },
  { topics: ["azure"],
    skills:  ["Azure","Docker","Kubernetes"] },
  { topics: ["gcp","google cloud"],
    skills:  ["GCP","Docker","Kubernetes"] },
  { topics: ["devops","devsecops"],
    skills:  ["Docker","Kubernetes","CI/CD","Jenkins","Terraform"] },
  { topics: ["docker","container","containerization"],
    skills:  ["Docker","Kubernetes","CI/CD"] },
  { topics: ["kubernetes","k8s"],
    skills:  ["Kubernetes","Docker","CI/CD"] },
  { topics: ["terraform","infrastructure as code","iac"],
    skills:  ["Terraform","Docker","Kubernetes","AWS"] },
  { topics: ["ci/cd","cicd","pipeline","jenkins"],
    skills:  ["CI/CD","Jenkins","Docker","Git"] },
  { topics: ["microservices","micro services"],
    skills:  ["Microservices","Java","Docker","Kubernetes","Spring Boot"] },
  { topics: ["system design","architecture","distributed systems"],
    skills:  ["System Design","Microservices","Java","Node.js"] },
  { topics: ["graphql"],
    skills:  ["GraphQL","Node.js","JavaScript"] },
  { topics: ["rest","rest api","restful","api development"],
    skills:  ["REST API","Node.js","Java","Python"] },
  { topics: ["mobile","app development","mobile development"],
    skills:  ["Flutter","Swift","Kotlin","React"] },
  { topics: ["flutter"],
    skills:  ["Flutter","Kotlin","Swift"] },
  { topics: ["android","kotlin"],
    skills:  ["Kotlin","Java","Flutter"] },
  { topics: ["ios","swift"],
    skills:  ["Swift","Flutter","Kotlin"] },
  { topics: ["golang","go language"],
    skills:  ["Go","Rust","C++"] },
  { topics: ["rust"],
    skills:  ["Rust","Go","C++"] },
  { topics: ["c++","cpp"],
    skills:  ["C++","Rust","Go"] },
  { topics: ["php","laravel"],
    skills:  ["PHP","Laravel","MySQL"] },
  { topics: ["linux","unix","bash","shell scripting"],
    skills:  ["Linux","Docker","CI/CD"] },
  { topics: ["elasticsearch","elastic search"],
    skills:  ["Elasticsearch","Redis","MongoDB"] },
  { topics: ["git","github","version control"],
    skills:  ["Git","CI/CD","Linux"] },
  { topics: ["tableau","power bi","data visualization","bi"],
    skills:  ["Tableau","Power BI","Data Science","Machine Learning"] },
];

// Ecosystem groups — used to find the closest related skill a candidate owns
const ecosystems = [
  ["Python","TensorFlow","PyTorch","Machine Learning","Data Science","Django","Tableau","Power BI"],
  ["Java","Spring Boot","Microservices","System Design"],
  ["JavaScript","TypeScript","React","Node.js","Express.js","Next.js","Angular","Vue.js","GraphQL"],
  ["Docker","Kubernetes","CI/CD","Jenkins","Terraform","AWS","Azure","GCP","Linux"],
  ["MongoDB","MySQL","PostgreSQL","Redis","Elasticsearch"],
  ["Swift","Kotlin","Flutter","React"],
  ["Go","Rust","C++","Linux"],
  ["PHP","Laravel","MySQL"],
];

// Given a question and a candidate's skills, return the skill to respond about
function detectAskedSkill(question, candidateSkills) {
  const q = question.toLowerCase();

  // 1 — candidate's own skill directly mentioned in the question (highest confidence)
  const directOwned = candidateSkills.find(s => q.includes(s.toLowerCase()));
  if (directOwned) {
    return { askedLabel: directOwned, responseSkill: directOwned, candidateHasIt: true };
  }

  // 2 — topic map lookup (longest phrase wins to avoid "ai" matching inside "trail")
  const sorted = [...topicSkillMap].sort((a, b) => {
    const maxA = Math.max(...a.topics.map(t => t.length));
    const maxB = Math.max(...b.topics.map(t => t.length));
    return maxB - maxA;
  });

  for (const entry of sorted) {
    const matchedTopic = entry.topics.find(t => q.includes(t));
    if (!matchedTopic) continue;

    // Does the candidate own any skill in this topic's list?
    const ownedMatch = entry.skills.find(rs =>
      candidateSkills.some(cs => cs.toLowerCase() === rs.toLowerCase())
    );
    if (ownedMatch) {
      return { askedLabel: matchedTopic, responseSkill: ownedMatch, candidateHasIt: true };
    }

    // Candidate doesn't own the asked skill — find closest owned skill by ecosystem
    const closestOwned = findClosestSkill(candidateSkills, entry.skills);
    return {
      askedLabel:    entry.skills[0],   // the "proper name" of asked skill
      responseSkill: closestOwned || candidateSkills[0],
      candidateHasIt: false
    };
  }

  // 3 — direct skillsPool mention (e.g. "MySQL" typed verbatim)
  const poolSkill = skillsPool.find(s => q.includes(s.toLowerCase()));
  if (poolSkill) {
    const has = candidateSkills.some(cs => cs.toLowerCase() === poolSkill.toLowerCase());
    return {
      askedLabel:    poolSkill,
      responseSkill: has ? poolSkill : (findClosestSkill(candidateSkills, [poolSkill]) || candidateSkills[0]),
      candidateHasIt: has
    };
  }

  // 4 — nothing detected → use candidate's primary skill
  return { askedLabel: candidateSkills[0], responseSkill: candidateSkills[0], candidateHasIt: true };
}

function findClosestSkill(candidateSkills, targetSkills) {
  for (const eco of ecosystems) {
    const targetInEco = targetSkills.some(t => eco.map(e => e.toLowerCase()).includes(t.toLowerCase()));
    if (targetInEco) {
      const match = candidateSkills.find(cs => eco.map(e => e.toLowerCase()).includes(cs.toLowerCase()));
      if (match) return match;
    }
  }
  return null;
}

const jdAliases = {
  "ai developer":           ["Python","TensorFlow","PyTorch","Machine Learning"],
  "ai engineer":            ["Python","TensorFlow","PyTorch","Machine Learning"],
  "ai":                     ["Python","TensorFlow","Machine Learning"],
  "artificial intelligence":["Python","TensorFlow","PyTorch","Machine Learning"],
  "machine learning engineer":["Python","TensorFlow","PyTorch","Machine Learning"],
  "ml developer":           ["Python","TensorFlow","Machine Learning"],
  "ml engineer":            ["Python","TensorFlow","Machine Learning"],
  "deep learning":          ["Python","TensorFlow","PyTorch"],
  "nlp engineer":           ["Python","TensorFlow","Machine Learning"],
  "nlp developer":          ["Python","TensorFlow","Machine Learning"],
  "computer vision":        ["Python","TensorFlow","PyTorch"],
  "generative ai":          ["Python","TensorFlow","PyTorch","Machine Learning"],
  "gen ai":                 ["Python","TensorFlow","PyTorch","Machine Learning"],
  "llm engineer":           ["Python","TensorFlow","Machine Learning"],
  "llm developer":          ["Python","TensorFlow","Machine Learning"],
  "data scientist":         ["Python","Machine Learning","TensorFlow"],
  "data science":           ["Python","Machine Learning","TensorFlow"],
  "mern":                   ["MongoDB","React","Node.js","Express.js"],
  "mern stack":             ["MongoDB","React","Node.js","Express.js"],
  "mean":                   ["MongoDB","Angular","Node.js","Express.js"],
  "mean stack":             ["MongoDB","Angular","Node.js","Express.js"],
  "full stack":             ["React","Node.js"],
  "fullstack":              ["React","Node.js"],
  "full-stack":             ["React","Node.js"],
  "frontend":               ["React","TypeScript"],
  "front-end":              ["React","TypeScript"],
  "front end":              ["React","TypeScript"],
  "backend":                ["Node.js","Python"],
  "back-end":               ["Node.js","Python"],
  "back end":               ["Node.js","Python"],
  "devops":                 ["Docker","Kubernetes","CI/CD"],
  "devops engineer":        ["Docker","Kubernetes","CI/CD"],
  "cloud engineer":         ["AWS","Docker"],
  "android developer":      ["Kotlin","Java"],
  "ios developer":          ["Swift"],
  "mobile developer":       ["Flutter"],
  "react developer":        ["React","JavaScript"],
  "react native":           ["React","JavaScript"],
  "node developer":         ["Node.js","JavaScript"],
  "node.js developer":      ["Node.js","Express.js"],
  "java developer":         ["Java","Spring Boot"],
  "java engineer":          ["Java","Spring Boot"],
  "spring boot":            ["Java","Spring Boot"],
  "python developer":       ["Python","Django"],
  "django developer":       ["Python","Django"],
  "php developer":          ["PHP","Laravel"],
  "golang":                 ["Go"],
  "go developer":           ["Go"],
  "software engineer":      ["Java","Python","Node.js"],
  "software developer":     ["Java","Python","JavaScript"],
  "web developer":          ["React","JavaScript","Node.js"],
  "microservices":          ["Java","Docker","Kubernetes"],
};

const roleKeywordSkills = [
  { keywords: ["ai","machine learning","ml","deep learning","nlp","tensorflow","pytorch","generative","llm"],
    skills: ["Python","TensorFlow","PyTorch","Machine Learning"] },
  { keywords: ["data scientist","data science","analytics","tableau","power bi"],
    skills: ["Python","Machine Learning","Data Science","Tableau"] },
  { keywords: ["devops","kubernetes","docker","terraform","ci/cd","jenkins","sre","platform"],
    skills: ["Docker","Kubernetes","CI/CD","Terraform"] },
  { keywords: ["cloud","aws","azure","gcp","infrastructure"],
    skills: ["AWS","Azure","GCP","Docker"] },
  { keywords: ["android","kotlin","mobile","ios","swift","flutter","react native"],
    skills: ["Kotlin","Swift","Flutter","Java"] },
  { keywords: ["react","frontend","front-end","ui","ux","next.js","vue","angular"],
    skills: ["React","TypeScript","JavaScript","Next.js"] },
  { keywords: ["java","spring","backend","microservices","enterprise"],
    skills: ["Java","Spring Boot","MySQL","Docker"] },
  { keywords: ["python","django","flask","fastapi"],
    skills: ["Python","Django","PostgreSQL","REST API"] },
  { keywords: ["node","express","javascript","typescript","web"],
    skills: ["Node.js","JavaScript","TypeScript","MongoDB"] },
  { keywords: ["database","sql","postgresql","mysql","mongodb","nosql","dba"],
    skills: ["PostgreSQL","MySQL","MongoDB","Redis"] },
  { keywords: ["golang","go","rust","c++","systems","embedded"],
    skills: ["Go","Rust","C++","Linux"] },
];

function inferSkillsFromRole(jdLower) {
  for (const entry of roleKeywordSkills) {
    if (entry.keywords.some(k => jdLower.includes(k))) return entry.skills;
  }
  return ["JavaScript","Python","Java","React","Node.js"];
}

const firstNames = [
  "Rahul","Anjali","Kiran","Sneha","Arjun","Priya","Vikram","Neha","Ravi","Divya",
  "Amit","Pooja","Suresh","Meena","Karthik","Lakshmi","Deepak","Shweta","Arun","Kavya",
  "Harish","Nandini","Sanjay","Rekha","Mohan","Sravya","Rajesh","Usha","Venkat","Bhavana",
  "Pavan","Sridevi","Abhishek","Tanvi","Naveen","Swathi","Girish","Padma","Manoj","Vani",
  "Akash","Asha","Nikhil","Gayatri","Rohit","Sirisha","Dinesh","Saritha","Prasad","Jyothi"
];
const lastNames = [
  "Sharma","Reddy","Kumar","Patel","Singh","Nair","Rao","Gupta","Iyer","Verma",
  "Pillai","Menon","Joshi","Das","Chopra","Bhat","Desai","Naidu","Shukla","Mishra",
  "Pandey","Tiwari","Dubey","Sinha","Shah","Mehta","Agarwal","Saxena","Yadav","Chauhan"
];
const colleges = [
  "IIT Bombay","IIT Delhi","IIT Madras","NIT Warangal","BITS Pilani","VIT Vellore",
  "Anna University","JNTU Hyderabad","Manipal University","Amrita University",
  "SRM University","Osmania University","Delhi University","Pune University"
];
const locations = [
  "Bangalore","Hyderabad","Chennai","Pune","Mumbai","Delhi NCR","Noida",
  "Gurgaon","Kolkata","Ahmedabad","Jaipur","Kochi","Coimbatore","Visakhapatnam"
];
const availabilityOptions = [
  "Immediately Available","Available in 15 days","Available in 30 days",
  "Available in 60 days","Currently employed, open to offers"
];
const interestProfiles = [
  { text:"I am actively looking for new opportunities and excited about this role.", level:"high" },
  { text:"I am open to the right opportunity that aligns with my career goals.", level:"medium" },
  { text:"I am passively exploring options but not in a rush to switch.", level:"medium" },
  { text:"Not actively looking, but would consider a compelling offer.", level:"low" },
  { text:"I am currently satisfied with my role and not looking to switch.", level:"none" }
];
const salaryRanges = ["₹8-12 LPA","₹12-18 LPA","₹18-25 LPA","₹25-35 LPA","₹35-50 LPA","₹50+ LPA"];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRoleByExperience(exp) {
  if (exp <= 1) return "Junior Developer";
  if (exp <= 3) return "Software Developer";
  if (exp <= 6) return "Senior Developer";
  if (exp <= 9) return "Tech Lead";
  return "Principal Engineer / Architect";
}

function generateCandidates(count = 200) {
  const result = [];
  for (let i = 1; i <= count; i++) {
    const firstName  = pickRandom(firstNames);
    const lastName   = pickRandom(lastNames);
    const shuffled   = [...skillsPool].sort(() => 0.5 - Math.random());
    const numSkills  = Math.floor(Math.random() * 4) + 2;
    const experience = Math.floor(Math.random() * 12) + 1;
    const profile    = pickRandom(interestProfiles);
    const salaryIdx  = Math.min(Math.floor(experience / 3), salaryRanges.length - 1);
    result.push({
      id: i, name: `${firstName} ${lastName}`,
      skills: shuffled.slice(0, numSkills), experience,
      college: pickRandom(colleges), location: pickRandom(locations),
      availability: pickRandom(availabilityOptions),
      expectedSalary: salaryRanges[salaryIdx],
      interestLevel: profile.level, response: profile.text,
      currentRole: getRoleByExperience(experience),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`
    });
  }
  return result;
}

const candidates = generateCandidates(200);

function safeParse(text) {
  try { return JSON.parse(text.replace(/```json|```/g,"").trim()); }
  catch { return null; }
}

function fallbackScore(candidate, jdSkills, requiredExp) {
  const matched = candidate.skills.filter(s =>
    jdSkills.some(j => j.toLowerCase() === s.toLowerCase())
  );

  let skillMatchPct = 0;
  if (jdSkills.length === 0) {
    skillMatchPct = 0;
  } else if (jdSkills.length === 1) {
    skillMatchPct = matched.length > 0 ? 100 : 0;
  } else {
    const primarySkill = jdSkills[0];
    const hasPrimary   = candidate.skills.some(s => s.toLowerCase() === primarySkill.toLowerCase());
    if (hasPrimary) {
      const otherJdSkills = jdSkills.slice(1);
      const otherMatched  = matched.filter(s => s.toLowerCase() !== primarySkill.toLowerCase()).length;
      const bonus = otherJdSkills.length > 0 ? (otherMatched / otherJdSkills.length) * 35 : 35;
      skillMatchPct = Math.round(65 + bonus);
    } else {
      skillMatchPct = Math.min(50, Math.round((matched.length / jdSkills.length) * 100));
    }
  }

  let expBonus = 0;
  if (requiredExp > 0) {
    const diff = Math.abs(candidate.experience - requiredExp);
    expBonus = diff <= 1 ? 15 : diff <= 2 ? 5 : 0;
  }

  const matchScore    = Math.min(100, skillMatchPct + expBonus);
  const interestScore = candidate.interestLevel === "high" ? 95 :
                        candidate.interestLevel === "medium" ? 70 :
                        candidate.interestLevel === "low" ? 40 : 10;

  return {
    matchScore, interestScore, matchedSkills: matched,
    missingSkills: jdSkills.filter(j =>
      !candidate.skills.some(s => s.toLowerCase() === j.toLowerCase())
    )
  };
}

async function parseJD(jd) {
  const jdLower = jd.toLowerCase();

  const aliasMatches  = [];
  const sortedAliases = Object.entries(jdAliases).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, skills] of sortedAliases) {
    if (jdLower.includes(phrase.toLowerCase())) {
      skills.forEach(s => { if (!aliasMatches.includes(s)) aliasMatches.push(s); });
    }
  }

  const directMatches = skillsPool.filter(s => jdLower.includes(s.toLowerCase()));
  const merged        = [...new Set([...aliasMatches, ...directMatches])];
  const finalSkills   = merged.length > 0 ? merged : inferSkillsFromRole(jdLower);

  const expMatch = jd.match(/(\d+)\s*\+?\s*(?:to\s*\d+\s*)?years?/i);
  const requiredExperience = expMatch ? parseInt(expMatch[1]) : 0;

  const rolePhrases = ["senior","junior","lead","principal","developer","engineer","architect","scientist","analyst"];
  const words       = jd.split(/\s+/);
  const roleWords   = words.filter(w => rolePhrases.some(r => w.toLowerCase().replace(/[^a-z\-]/g,"").includes(r)));
  const roleTitle   = roleWords.length > 0
    ? roleWords.slice(0,4).join(" ").replace(/[^a-zA-Z\s\-]/g,"").trim()
    : "Software Engineer";

  const fallbackResult = { skills: finalSkills, requiredExperience, roleTitle: roleTitle || "Software Engineer" };

  if (!openai) return fallbackResult;
  try {
    const res = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role:"user", content:`Extract info from this Job Description. Return ONLY valid JSON.\n\nJD:\n${jd}\n\nFormat:\n{"skills":["skill1"],"requiredExperience":3,"roleTitle":"Senior Developer"}` }],
      max_tokens: 300
    });
    const parsed = safeParse(res.choices[0].message.content);
    if (parsed?.skills?.length > 0) return parsed;
    throw new Error("empty");
  } catch (err) {
    console.log("AI parse failed, using smart fallback:", err.message);
    return fallbackResult;
  }
}

function buildFallbackReply(question, candidate, turnIndex) {
  const q  = question.toLowerCase();
  const sk = candidate.skills;
  const lv = candidate.interestLevel;
  const pick = (arr) => arr[turnIndex % arr.length];
  const yrs = Math.min(candidate.experience, 5);

  // Resolve the correct skill to talk about
  const { askedLabel, responseSkill, candidateHasIt } = detectAskedSkill(question, sk);

  // A genuinely different secondary skill to mention (not same as responseSkill)
  const secondarySkill = sk.find(s => s.toLowerCase() !== responseSkill.toLowerCase()) || sk[0];

  // ── Question type detection ───────────────────────────────────────
  const asksInterest     = /open|interest|looking|exploring|opportunity|switch|consider|move/i.test(q);
  const asksSkills       = /skill|experience|work|project|used|know|familiar|built|technical|comfortable|proficient|background|aware|have you|expertise|hands.on|strong in|good at/i.test(q);
  const asksSalary       = /salary|ctc|compensation|package|pay|expect|budget|lpa/i.test(q);
  const asksAvailability = /available|notice|join|when|start|immediately|days/i.test(q);
  const asksWhyLeave     = /why|reason|leaving|switch|change|current|unhappy/i.test(q);
  const asksGoals        = /goal|future|next|career|plan|aspire|5 year/i.test(q);
  const asksRole         = /role|position|job|responsibilities|team|about the/i.test(q);
  const yearsAsked       = /years|how long|how much|experience in/i.test(q);

  // ── INTEREST ─────────────────────────────────────────────────────
  const interestPhrases = {
    high: [
      `Actively looking — and a ${responseSkill}-focused role like this is exactly the direction I want to go.`,
      `Definitely open. I've been targeting opportunities where ${responseSkill} is central, and this sounds like it qualifies.`,
      `Yes, very interested. My ${responseSkill} background lines up well with what you're describing.`
    ],
    medium: [
      `Selectively exploring. If this role gives meaningful ${responseSkill} work with real ownership, it's worth a conversation.`,
      `Open to the right opportunity. ${responseSkill} is my core area so this is relevant — depends on the scope.`,
      `Not in a rush, but I'll listen. The ${responseSkill} angle makes it interesting.`
    ],
    low: [
      `Fairly settled right now. A compelling ${responseSkill} opportunity could change that, but the bar is high.`,
      `Not actively looking. If the ${responseSkill} depth and scale are exceptional, I'd hear it out.`,
      `I'd need a strong reason to move — significantly better ${responseSkill} work or a bigger scope.`
    ],
    none: [
      `I'm not looking right now. Genuinely happy where I am.`,
      `I appreciate the outreach, but I'm not considering a switch at this point.`,
      `Not interested right now — things are going well.`
    ],
  };
  if (asksInterest) return pick(interestPhrases[lv] || interestPhrases.medium);

  // ── SKILL / EXPERIENCE ────────────────────────────────────────────
  if (asksSkills || yearsAsked) {
    if (candidateHasIt) {
      return pick([
        `Yes, ${responseSkill} is one of my strongest areas — about ${yrs} years of hands-on production experience. I've built real systems with it, not just side projects. Happy to get into specifics.`,
        `Absolutely. ${responseSkill} has been central to my work as a ${candidate.currentRole} for ${yrs}+ years. I've used it alongside ${secondarySkill} in several significant projects.`,
        `${responseSkill} is my core stack. ${yrs} years of real-world usage — I know the pitfalls, the edge cases, and the patterns that actually work in production.`,
        `Very comfortable with ${responseSkill}. It's what I spend most of my time in day-to-day. ${secondarySkill} complements it well in my current setup.`,
      ]);
    } else {
      return pick([
        `I don't have direct production experience with ${askedLabel}, but my ${responseSkill} background covers very similar ground. The ramp-up would be quick given ${candidate.experience} years in the same ecosystem.`,
        `${askedLabel} isn't my primary stack — I've been more hands-on with ${responseSkill} and ${secondarySkill}. That said, the concepts transfer and I pick up new tech fast.`,
        `Honest answer: limited ${askedLabel} in production. My strength is ${responseSkill}, which is closely adjacent. I've explored ${askedLabel} outside work and the learning curve is manageable.`,
        `Not my core — ${responseSkill} is where I'm strongest. I understand ${askedLabel} conceptually and have worked with related tools, so I'd get up to speed quickly.`,
      ]);
    }
  }

  // ── SALARY ───────────────────────────────────────────────────────
  if (asksSalary) {
    return pick([
      `I'm targeting ${candidate.expectedSalary}. Open to discussion if the role and growth trajectory justify it.`,
      `Around ${candidate.expectedSalary} is my range. The compensation matters, but so does the quality of the ${responseSkill} work.`,
      `${candidate.expectedSalary} is where I'm looking. Flexible if the opportunity is genuinely strong.`,
    ]);
  }

  // ── AVAILABILITY ──────────────────────────────────────────────────
  if (asksAvailability) {
    return pick([
      `${candidate.availability}. Can align to your timeline if we move forward.`,
      `I'm ${candidate.availability.toLowerCase()}. If the process is quick, that works well.`,
      `Currently ${candidate.availability.toLowerCase()} — timing should work if we're aligned on the opportunity.`,
    ]);
  }

  // ── WHY LEAVING ───────────────────────────────────────────────────
  const whyMap = {
    high: [
      `I want a bigger challenge. My ${responseSkill} work has become routine — I'm ready for more ownership and scale.`,
      `Looking for a place where ${responseSkill} is core to the product, not an afterthought. The impact here seems more real.`,
      `Ready for the next level — more scope, stronger team, harder ${responseSkill} problems.`
    ],
    medium: [
      `Things are fine, but I've plateaued. The right ${responseSkill} challenge would get me moving.`,
      `Growth has slowed down. I want to go deeper on ${responseSkill} and take on more complex problems.`,
      `Not unhappy — just intentional about what's next. Serious ${responseSkill} work would be compelling.`
    ],
    low: [
      `Honestly, I'd need a strong pull factor — meaningfully better ${responseSkill} scope or much bigger impact.`,
      `I'm comfortable where I am. The bar to move is high.`,
      `Not a lot pushing me out. Only a genuinely differentiated ${responseSkill} opportunity would shift that.`
    ],
    none: [
      `I'm not looking to leave. I enjoy the work and see a clear path forward.`,
      `No reason to switch right now — things are going well.`,
      `Not planning a move. The role would have to be truly exceptional.`
    ],
  };
  if (asksWhyLeave) return pick(whyMap[lv] || whyMap.medium);

  // ── CAREER GOALS ─────────────────────────────────────────────────
  if (asksGoals) {
    return pick([
      `In 3 years I want to be in an architect or tech lead role — owning the ${responseSkill} stack end-to-end, mentoring engineers, shaping product decisions.`,
      `Deep expertise in ${responseSkill} paired with real leadership. Go from doing to designing systems at scale.`,
      `Senior IC or lead role where ${responseSkill} and ${secondarySkill} are central. I want real impact, not just delivery.`,
    ]);
  }

  // ── ROLE / TEAM ───────────────────────────────────────────────────
  if (asksRole) {
    return pick([
      `What does the day-to-day look like — is ${responseSkill} central to the product, or more of a supporting tool?`,
      `Sounds interesting. Is this primarily a ${responseSkill}-focused team, or more of a mixed stack?`,
      `What's the ownership model? I'm most effective when I can drive the ${responseSkill} architecture, not just execute on tickets.`,
    ]);
  }

  // ── GENERIC (always references real skill) ────────────────────────
  return pick([
    `With ${candidate.experience} years focused largely on ${responseSkill}, I've navigated most of what comes with it. What specifically are you trying to assess?`,
    `My ${responseSkill} background shapes how I approach this kind of problem. Happy to get specific if that's useful.`,
    `Coming from ${candidate.experience} years as a ${candidate.currentRole}, I'm grounded in real delivery. Want to dig into ${responseSkill} specifics?`,
    `Good question. I'm most confident on ${responseSkill} and ${secondarySkill} — want me to walk through a concrete example?`,
  ]);
}

function scoreReplyForInterest(replyText, baseInterestLevel, previousScore) {
  const r = replyText.toLowerCase();
  const strongPos = ["actively looking","definitely open","definitely interested","sounds great","excited about","this is exactly","great fit","looking forward","very interested","sounds perfect","would love to","keen to","really interested","strong fit","compelling","absolutely"];
  const modPos    = ["open to","could work","worth exploring","sounds promising","happy to discuss","interesting","could be a fit","let's talk","would consider","selectively exploring","sounds relevant"];
  const modNeg    = ["not actively","fairly settled","depends on","not in a rush","would need convincing","high bar","not sure","only if","bar is high"];
  const strongNeg = ["not interested","not looking","very happy","not for me","not right now","not considering","happy where i am","not planning","not in a position","appreciate but","no thanks"];

  let delta = 0;
  strongPos.forEach(s => { if (r.includes(s)) delta += 18; });
  modPos.forEach(s =>    { if (r.includes(s)) delta += 9; });
  modNeg.forEach(s =>    { if (r.includes(s)) delta -= 9; });
  strongNeg.forEach(s => { if (r.includes(s)) delta -= 18; });
  delta = Math.max(-25, Math.min(25, delta));

  const priorMap   = { high:80, medium:60, low:35, none:12 };
  const prior      = priorMap[baseInterestLevel] ?? 50;
  const startScore = previousScore ?? prior;
  const regression = (prior - startScore) * 0.15;
  return Math.max(5, Math.min(98, Math.round(startScore + delta + regression)));
}

// ─── Routes ───────────────────────────────────────────────────────
app.get("/candidates", (req, res) => {
  res.json({
    total: candidates.length,
    byInterest: {
      high:   candidates.filter(c => c.interestLevel==="high").length,
      medium: candidates.filter(c => c.interestLevel==="medium").length,
      low:    candidates.filter(c => c.interestLevel==="low").length,
      none:   candidates.filter(c => c.interestLevel==="none").length,
    }
  });
});

app.post("/analyze", async (req, res) => {
  const { jd } = req.body;
  if (!jd?.trim()) return res.status(400).json({ error:"JD is required" });

  try {
    const parsed      = await parseJD(jd);
    const jdSkills    = parsed.skills || [];
    const requiredExp = parsed.requiredExperience || 0;

    console.log(`📋 Role:"${parsed.roleTitle}" | Skills:[${jdSkills.join(", ")}] | Exp:${requiredExp}yrs`);

    if (!jdSkills.length) return res.json({ candidates:[], jdInfo:parsed });

    const filtered = candidates.filter(c =>
      c.skills.some(s => jdSkills.some(j => j.toLowerCase()===s.toLowerCase()))
    );

    console.log(`👥 ${filtered.length} candidates matched`);
    if (!filtered.length) return res.json({ candidates:[], jdInfo:parsed });

    const results = filtered.map(c => {
      const score      = fallbackScore(c, jdSkills, requiredExp);
      const finalScore = Math.round(0.55 * score.matchScore + 0.45 * score.interestScore);
      return {
        ...c,
        matchScore:    score.matchScore,
        interestScore: score.interestScore,
        finalScore,
        matchedSkills: score.matchedSkills,
        missingSkills: score.missingSkills,
        recommendation:
          finalScore >= 80 ? "Strong Hire"    :
          finalScore >= 60 ? "Potential Hire" :
          finalScore >= 40 ? "Consider"       : "Weak Match",
        conversationInterestScore: null,
        outreachCompleted: false
      };
    });

    results.sort((a,b) => b.finalScore - a.finalScore);
    res.json({ candidates:results, jdInfo:parsed });

  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error:"Analysis failed" });
  }
});

const sessions = {};

app.post("/chat", async (req, res) => {
  const { message, candidate, sessionId } = req.body;
  if (!message||!candidate||!sessionId)
    return res.status(400).json({ error:"Missing fields" });

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: [{
        role: "system",
        content: `You are ${candidate.name}, a real software professional being contacted by a recruiter.

PROFILE (never contradict this):
- Role: ${candidate.currentRole}
- Experience: ${candidate.experience} years
- Skills: ${candidate.skills.join(", ")}
- Location: ${candidate.location}
- Availability: ${candidate.availability}
- Expected Salary: ${candidate.expectedSalary}
- Interest Level: ${candidate.interestLevel}
- Disposition: "${candidate.response}"

CRITICAL RULES:
1. When asked about a SPECIFIC SKILL or TOPIC (e.g. "experience in AI?", "do you know React?"):
   - Identify the exact skill or technology being asked about.
   - Check your skills list above.
   - If that skill OR a closely related skill IS in your list → answer YES confidently with a brief real example using THAT skill.
   - If it is NOT in your list → be honest: say you don't have it, then mention your most relevant owned skill.
   - NEVER mention a skill not in your list as something you are proficient in.
   - NEVER swap skills (e.g. don't say "MySQL" when asked about "AI").
2. Keep replies 2-3 sentences. Natural and varied.
3. Match your interest level in tone — high=enthusiastic, none=firm but polite.
4. NEVER reveal you are AI.`
      }],
      turnIndex: 0,
      interestScore: null,
      interestHistory: []
    };
  }

  const session = sessions[sessionId];
  session.history.push({ role:"user", content:message });
  session.turnIndex++;

  let reply, aiWorked = false;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "mistralai/mistral-7b-instruct",
        messages: session.history,
        max_tokens: 180, temperature: 0.85, top_p: 0.9
      });
      reply    = response.choices[0].message.content.trim();
      aiWorked = true;
    } catch (err) { console.error("OpenRouter error:", err.message); }
  }

  if (!aiWorked) reply = buildFallbackReply(message, candidate, session.turnIndex);

  session.history.push({ role:"assistant", content:reply });

  const prev     = session.interestScore;
  const newScore = scoreReplyForInterest(reply, candidate.interestLevel, prev);
  session.interestScore = newScore;
  session.interestHistory.push({ turn:session.turnIndex, score:newScore, delta:prev!=null?newScore-prev:0 });

  res.json({ reply, conversationInterestScore:newScore, interestHistory:session.interestHistory, aiPowered:aiWorked });
});

app.post("/outreach", async (req, res) => {
  const { candidate, jobTitle } = req.body;
  const fallback = `Hi ${candidate.name.split(" ")[0]}, your ${candidate.skills[0]} experience really stood out. We have a ${jobTitle} role that could be a great match — open to a quick 15-min call this week?`;
  if (!openai) return res.json({ message:fallback });
  try {
    const r = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role:"user", content:`Write a 3-sentence recruiter outreach for ${candidate.name}, ${candidate.experience}yr ${candidate.skills[0]} expert, for ${jobTitle} role. Warm, specific, ends with CTA. Only the message text.` }],
      max_tokens: 120
    });
    res.json({ message:r.choices[0].message.content.trim() });
  } catch { res.json({ message:fallback }); }
});

app.post("/shortlist/export", (req, res) => {
  const { candidates:list, jobTitle } = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error:"candidates array required" });
  const headers = ["Rank","Name","Role","Exp","Location","Match","Interest","Live Interest","Final","Recommendation","Skills","Availability","CTC","Email","Phone"];
  const rows = list.map((c,i) => [
    i+1,c.name,c.currentRole,c.experience,c.location,
    c.matchScore,c.interestScore,c.conversationInterestScore??"Not Assessed",
    c.finalScore,c.recommendation,
    `"${(c.skills||[]).join(", ")}"`,c.availability,c.expectedSalary,c.email,c.phone
  ]);
  const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition",`attachment; filename="HireSense_${(jobTitle||"Shortlist").replace(/\s+/g,"_")}_${Date.now()}.csv"`);
  res.send(csv);
});

setInterval(() => {
  const cutoff = Date.now() - 7200000;
  Object.keys(sessions).forEach(k => { if (parseInt(k.split("_")[1]||k) < cutoff) delete sessions[k]; });
}, 3600000);

app.listen(5000, () => console.log("🚀 HireSense AI running on https://hiresenseai-xp0u.onrender.com"));