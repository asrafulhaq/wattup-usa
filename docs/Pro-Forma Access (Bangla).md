# WattUpUSA Site Pro-Forma Builder — Access Control
## PRD-এর সম্পূর্ণ বাংলা ব্যাখ্যা

> সোর্স: `docs/Pro-Forma Access.md` (PRD v1, 2 September 2026)
> সোর্স কোড: `docs/Pro-Forma source/`
> এই ডকুমেন্টটি PRD-এর অনুবাদ নয়। এটি ব্যাখ্যা: ক্লায়েন্ট আসলে কী চাইছে, কেন চাইছে,
> কোনটা কীভাবে বানাতে হবে, এবং PRD-তে কোন কোন জায়গা কোডের সাথে মেলে না।

---

## 0. এক প্যারায় পুরো ব্যাপারটা

WattUpUSA-র একটা ইন্টারনাল টুল আছে, নাম **Site Pro-Forma Builder**। এটা দিয়ে সেলস টিম
একটা EV charging site-এর জন্য landlord/host-কে দেখানোর মতো 6 পাতার revenue proposal
তৈরি করে। টুলটা পুরোপুরি browser-এ চলে, কোনো backend নেই, কোনো database নেই।

এখন এই টুলে ঢুকতে **একটাই শেয়ার্ড পাসওয়ার্ড** লাগে। পুরো টিম একই পাসওয়ার্ড ব্যবহার করে।
সমস্যা হলো, কেউ কোম্পানি ছেড়ে গেলে তার অ্যাক্সেস বন্ধ করার একমাত্র উপায় হলো পাসওয়ার্ড
বদলে সবাইকে নতুন পাসওয়ার্ড দেওয়া। আর কে কখন ঢুকেছে, তার কোনো রেকর্ড নেই।

ক্লায়েন্ট চাইছে এই গেটটা বদলে **email + one-time code (OTP)** করা হোক, এবং কে ঢুকতে
পারবে সেই লিস্টটা যেন wattupusa.com-এর dashboard থেকে কন্ট্রোল করা যায়। ফলে কাউকে
সরাতে হলে dashboard থেকে সরিয়ে দিলেই 5 মিনিটের মধ্যে তার অ্যাক্সেস বন্ধ, কোনো redeploy
লাগবে না।

**সবচেয়ে গুরুত্বপূর্ণ কথা: টুলটার ভেতরে কিচ্ছু বদলাচ্ছে না।** `model.js`, `doc.js`,
`evpin.js`, `app.js` অপরিবর্তিত থাকবে। এটা পুরোপুরি একটা **নতুন দরজা, পুরনো ঘরের সামনে**।

---

## 1. ক্লায়েন্ট আসলে কী বলতে চাইছে

PRD-র ভাষা টেকনিক্যাল, কিন্তু ভেতরের চাওয়াটা আসলে চারটা:

**১. "আমি জানতে চাই কে ঢুকছে।"**
এখন শেয়ার্ড পাসওয়ার্ড, তাই কে ঢুকল কেউ জানে না। Email দিয়ে লগইন করালে প্রত্যেক
ব্যবহারকারীর একটা পরিচয় থাকবে, এবং একটা sign-in log রাখা যাবে।

**২. "কাউকে সরাতে চাইলে যেন সাথে সাথে সরাতে পারি, ডেভেলপারকে না ডেকে।"**
এটাই আসল ব্যথা। এখন কাউকে সরাতে হলে পাসওয়ার্ড বদলাতে হয়, redeploy করতে হয়, আর
বাকি পুরো টিমকে নতুন পাসওয়ার্ড জানাতে হয়। নতুন সিস্টেমে dashboard থেকে নাম কেটে
দিলেই সর্বোচ্চ 5 মিনিটে কাজ শেষ।

**৩. "বাইরের কেউ যেন বুঝতেই না পারে ভেতরে কী আছে, বা কে টিমে আছে।"**
এটা PRD-র সবচেয়ে বেশি জোর দেওয়া অংশ। কেউ যদি অচেনা একটা email দিয়ে চেষ্টা করে,
সিস্টেম **একই উত্তর** দেবে যেটা একজন আসল টিম মেম্বারকে দিত। কোনো "এই email পাওয়া
যায়নি" জাতীয় মেসেজ নেই। স্ক্রিনও একইভাবে পরের ধাপে (code entry) চলে যাবে।
ব্যবহারকারী শুধু বসে থাকবে, code কোনোদিন আসবে না। একে বলে **no user enumeration**:
বাইরের লোক যেন probe করে টিমের email লিস্ট বের করতে না পারে।

**৪. "টুলটা যেন নিজের একটা ঠিকানায় থাকে, মার্কেটিং সাইট থেকে আলাদা।"**
`hostproposal.wattupusa.com`, আলাদা Vercel container-এ। মার্কেটিং সাইটে হাত পড়বে না।

---

## 2. এখন কী আছে বনাম কী হবে

| বিষয় | এখন যা আছে | যা হবে |
|---|---|---|
| **পরিচয়** | কোনো পরিচয় নেই। একটা শেয়ার্ড পাসওয়ার্ড। | Email ঠিকানা, code দিয়ে যাচাই করা। |
| **কে ঢুকতে পারবে** | যার কাছে পাসওয়ার্ড আছে, সেই। | Dashboard API থেকে আসা মেম্বার লিস্ট, 5 মিনিট cache করা। |
| **অ্যাক্সেস বাতিল** | পাসওয়ার্ড বদলাও, redeploy করো, সবাইকে জানাও। | Dashboard থেকে সরিয়ে দাও। 5 মিনিটে কার্যকর। |
| **সেশন** | 30 দিনের signed cookie। | 7 দিনের signed cookie, ভেতরে email আছে, প্রতি request-এ যাচাই হয়। |
| **স্টোরেজ** | কিছু নেই। | Key-value store (Redis)। |
| **ইমেইল পাঠানো** | নেই। | Resend, একটা send subdomain থেকে। |
| **অডিট / লগ** | নেই। | Sign-in log, 90 দিন রাখা হবে। |

### বর্তমান কোড থেকে যা যা রাখতে হবে

`middleware.ts` ফাইলে এখন যে চারটা জিনিস ঠিকভাবে করা আছে, সেগুলো নতুন কোডেও থাকবে:

1. **Fail closed** — environment variable না থাকলে সাইট 503 দেবে, খোলা সাইট serve করবে না।
   এটা ইচ্ছাকৃত। ভুল করে কনফিগ মিস হলে সাইট যেন উন্মুক্ত না হয়ে যায়।
2. **`sameString()` helper** — constant time string comparison। সাধারণ `===` দিয়ে
   তুলনা করলে কত অক্ষর মিলেছে তা সময় মেপে বোঝা যায় (timing attack)। এই helper
   সেটা ঠেকায়।
3. **`safeNext()` check** — লগইনের পর যেখানে redirect হবে সেটা যেন শুধু নিজের সাইটের
   ভেতরের path হয়। না হলে গেটটাকে open redirect হিসেবে ব্যবহার করে ফিশিং করা যেত।
4. **`/assets/` ungated** — লগইন স্ক্রিনে WattUp-এর logo দেখাতে হয়, তাই ওই ফোল্ডারটা
   গেটের বাইরে। শুধু পাবলিক ব্র্যান্ড ফাইল ওখানে থাকবে, আর কিছু না।

আর cutover-এর দিন **`SITE_PASSWORD` এবং তার পুরো কোডপথ মুছে ফেলতে হবে।** অর্ধেক
রেখে দেওয়া চলবে না, কারণ তাহলে পুরনো দরজাটা খোলাই থেকে যায়।

---

## 3. সাইন ইন ফ্লো, ধাপে ধাপে

ব্যবহারকারী যা দেখবে:

```
[ধাপ 1]  Email লিখুন  →  "Continue"
              ↓
    "if that address is on the team list, a code is on its way"
              ↓
[ধাপ 2]  6 সংখ্যার code লিখুন  →  "Verify"
              ↓
         টুলে ঢুকে গেলেন
```

সিস্টেমের ভেতরে যা ঘটে:

| ধাপ | কী হয় | কেন |
|---|---|---|
| 1 | Email normalise করা: সামনে-পিছনের space কেটে, ছোট হাতের অক্ষরে বদলে। | `Ripon@X.com` আর `ripon@x.com ` যেন একই ধরা হয়। |
| 2 | Rate limit চেক। সীমা ছাড়ালে generic উত্তর, কোনো email পাঠানো হবে না। | Brute force ও spam ঠেকাতে। |
| 3 | Cache করা মেম্বার লিস্টে email খোঁজা। না থাকলে বা `active: false` হলে generic উত্তর, কোনো email নেই। | এখানেই আসল অ্যাক্সেস সিদ্ধান্ত হয়। |
| 4 | `crypto.getRandomValues` দিয়ে 6 সংখ্যার code বানানো। **সব জায়গায় string হিসেবে** রাখতে হবে। | Number বানালে `012345` হয়ে যাবে `12345`, leading zero হারিয়ে যাবে। |
| 5 | KV-তে `sha256(code + email + GATE_SECRET)` রাখা, TTL 600 সেকেন্ড, attempts = 0। **Code নিজে কখনো store বা log হবে না।** | KV leak হলেও যেন code পড়া না যায়। |
| 6 | Resend দিয়ে email পাঠানো। Provider fail করলেও ব্যবহারকারী একই generic উত্তরই পাবে, শুধু আমাদের alert যাবে। | ব্যর্থতাও যেন তথ্য ফাঁস না করে। |
| 7 | Verify-র সময় constant time compare। ভুল হলে attempts বাড়বে। 5 বার হলে key ডিলিট। | Code guess করা ঠেকাতে। |
| 8 | সফল হলে key ডিলিট, session cookie সেট, `safeNext` দিয়ে redirect। | একটা code একবারই ব্যবহারযোগ্য। |

### Generic response, ব্যাপারটা ঠিক কী

এটাই এই PRD-র মূল নিরাপত্তা ধারণা। Email জমা দিলে সবসময় HTTP 200 আর একই লেখা যাবে:

> *"if that address is on the team list, a code is on its way"*

Member হোক বা না হোক:
- **status code এক** (200)
- **response body এক** (হুবহু একই বাক্য)
- **সময় এক** (কতক্ষণে উত্তর এলো, তাতেও পার্থক্য থাকবে না)
- **স্ক্রিন এক** (দুই ক্ষেত্রেই code entry-তে চলে যাবে)

তিনটার যেকোনো একটাতে পার্থক্য থাকলে বাইরের লোক email লিস্ট বের করে ফেলতে পারবে।
সময়ের অংশটা নিয়ে **আমার একটা আপত্তি আছে, দেখুন section 14.3।**

---

## 4. রুট এবং মিডলওয়্যার

| রুট | Method | কাজ |
|---|:---:|---|
| `/login` | GET | দুই ধাপের লগইন স্ক্রিন। গেটের বাইরে। |
| `/api/auth/request-otp` | POST | Body: email। সবসময় 200, সবসময় একই generic body। |
| `/api/auth/verify-otp` | POST | Body: email + code। সফল হলে cookie সেট করে redirect target ফেরত দেয়। |
| `/api/auth/logout` | POST | Cookie মুছে দেয়। |
| **বাকি সব** | any | গেটেড। বৈধ session না থাকলে `/login`-এ পাঠাবে, আসল path মনে রেখে। |

**Middleware matcher** শুধু এগুলো বাদ দেবে: `/login`, `/api/auth/`, `/assets/`,
`/favicon`, `_vercel`। **আর কিচ্ছু না।**

> **সবচেয়ে বড় ফাঁদ:** `middleware.ts` অবশ্যই **repository-র root-এ** থাকতে হবে।
> কোনো সাবফোল্ডারে রাখলে Vercel সেটা চালায়ই না, আর তখন **পুরো সাইট কোনো গেট ছাড়াই
> খোলা অবস্থায় serve হয়।** এটা নীরবে ঘটে, কোনো error দেখায় না। DEPLOY.md-তেও এই
> সতর্কবার্তা আছে, এবং acceptance test-এ `js/model.js` সরাসরি চেয়ে দেখার কথা বলা
> আছে ঠিক এই কারণেই।

---

## 5. মেম্বার লিস্ট: Phase 1 আর Phase 2

কে ঢুকতে পারবে সেই লিস্টটা আসবে wattupusa.com dashboard থেকে। **কিন্তু ওই API এখনো
তৈরি হয়নি।** তাই কাজ দুই ভাগে:

### Phase 1 (এখনই শুরু করা যাবে)
`FALLBACK_ALLOWLIST` নামে একটা environment variable-এ comma দিয়ে আলাদা করা email-এর
লিস্ট থাকবে। উদাহরণ:

```
FALLBACK_ALLOWLIST=ripon@wattupusa.com,harshil@wattupusa.com
```

### Phase 2 (dashboard টিম endpoint দিলে)
`ALLOWLIST_API_URL` সেট করা হলে কোড API থেকে লিস্ট পড়বে। সেট না থাকলে env variable
থেকে পড়বে।

**এই একটা `if` শর্তই পুরো পার্থক্য।** এর মানে হলো **dashboard টিমের জন্য কাউকে বসে
থাকতে হবে না।** আজই Phase 1 বানিয়ে লঞ্চ করা যায়, পরে শুধু দুইটা env variable যোগ
করলেই Phase 2 চালু হয়ে যাবে। কোনো rewrite লাগবে না।

### Dashboard টিমকে যা বানাতে হবে

একটা authenticated GET endpoint। Authorization header-এ bearer token, দুই পাশেই
token env variable-এ, এবং **constant time-এ মিলিয়ে দেখতে হবে**।

Response-এর শেপ:

| ফিল্ড | টাইপ | নোট |
|---|:---:|---|
| `email` | string | Dashboard-ই lowercase ও trim করে দেবে। |
| `name` | string | শুধু দেখানোর জন্য। অ্যাক্সেস সিদ্ধান্তে ব্যবহার হবে না। |
| `active` | bool | `false` হলেও entry-টা পাঠাতে হবে, আমরা সেটাকে denied ধরব। |
| `generated_at` | ISO 8601 | Cache কত পুরনো তা বোঝার জন্য। |

### Cache এবং outage-এর সময় কী হবে

- লিস্ট KV-তে `allowlist:v1` কী-তে জমা থাকবে, TTL 300 সেকেন্ড (5 মিনিট)।
  **এই 5 মিনিটই সেই ব্যবধান যার কারণে dashboard থেকে সরালে redeploy ছাড়াই কাজ হয়।**
- **Dashboard ডাউন, কিন্তু cache 24 ঘণ্টার কম পুরনো** → cache থেকেই চালাও, alert পাঠাও।
  *কারণ: মিটিংয়ের মাঝখানে পুরো টিম যেন হঠাৎ সাইন আউট হয়ে না যায়।*
- **Dashboard ডাউন, cache নেই বা 24 ঘণ্টার বেশি পুরনো** → 503। **Fail closed।**

---

## 6. সেশন

- Cookie-র নাম `wu_session`। মান হলো `base64url(payload)` + ওই payload-এর
  HMAC-SHA256 signature, key হিসেবে `GATE_SECRET`।
- Payload-এ থাকবে শুধু **email, iat (কখন তৈরি), exp (কখন শেষ)**। আর কিছু না।
- Flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`।
- মেয়াদ 7 দিন (`SESSION_TTL_DAYS` দিয়ে বদলানো যায়)। এখনকার 30 দিন থেকে কমানো হয়েছে।
- **প্রতিটা গেটেড request-এ cookie-র email আবার মেম্বার লিস্টে মিলিয়ে দেখতে হবে।**
  শুধু signature ঠিক আছে কি না দেখলে হবে না।

  > **এই পয়েন্টটা কেন গুরুত্বপূর্ণ:** এটা না করলে dashboard থেকে সরানো লোকটা তার
  > cookie-র মেয়াদ শেষ না হওয়া পর্যন্ত, অর্থাৎ 7 দিন পর্যন্ত, ঢুকতে পারবে। তখন
  > "5 মিনিটে revocation" প্রতিশ্রুতিটা মিথ্যা হয়ে যায়।

- যাচাই ব্যর্থ হলে cookie মুছে `/login`-এ পাঠাও।
- **`GATE_SECRET` বদলালে সবার সব session একসাথে বাতিল হয়।** এটাই break glass path,
  অর্থাৎ জরুরি অবস্থায় সবাইকে সাথে সাথে বের করে দেওয়ার উপায়।

---

## 7. রেট লিমিট

| সীমা | কতবার | সময়সীমা |
|---|:---:|:---:|
| একটা email-এ code চাওয়া | 5 | 1 ঘণ্টা |
| একটা IP থেকে code চাওয়া | 20 | 1 ঘণ্টা |
| একটা code-এ verify চেষ্টা | 5 | Code-এর আয়ু |
| একই ঠিকানায় পরপর দুই send-এর ব্যবধান | 60 সেকেন্ড | Rolling |

সীমা ছাড়ালেও ব্যবহারকারী **সেই একই generic উত্তরই** পাবে, আলাদা কোনো error না।
কারণ আলাদা error দিলে সেটাও একটা সংকেত হয়ে যায়।

সব counter-এর key হবে identifier-এর **salted hash**, raw email বা raw IP না।

---

## 8. KV কী-গুলো

| Key | ভেতরে কী | TTL |
|---|---|:---:|
| `otp:{hash(email)}` | Code-এর hash, কতবার চেষ্টা হয়েছে, কখন তৈরি। | 600s |
| `rl:req:{hash(email)}` | Counter। | 3600s |
| `rl:ip:{hash(ip)}` | Counter। | 3600s |
| `rl:gap:{hash(email)}` | Marker। | 60s |
| `allowlist:v1` | Cache করা মেম্বার লিস্ট + কখন আনা হয়েছে। | 300s |
| `signin:{date}` | Sign-in log: email, সময়, IP, user agent। | 90 দিন |

---

## 9. ইমেইল

- Resend দিয়ে পাঠানো হবে, **apex domain থেকে নয়, একটা send subdomain থেকে।**
- Email-এ থাকবে: 6 সংখ্যার code (**select করে copy করা যায় এমন text হিসেবে**, ছবি নয়),
  10 মিনিটের মেয়াদের কথা, আর একটা লাইন যে "আপনি না চেয়ে থাকলে এটা উপেক্ষা করুন"।
- Plain text আর HTML দুই ভার্সনই থাকবে। HTML-টা লগইন স্ক্রিনের dark theme-এর সাথে
  মিলবে, যাতে দেখে ফিশিং মনে না হয়।
- **Reply-To একটা monitored inbox**, no-reply নয়। কেউ উত্তর দিলে যেন কেউ পড়ে।
- **Code কোনো log line-এ, কোনো error body-তে, কোনো analytics event-এ যাবে না।**
  Log-এ email থাকলে সেটা hash করা বা কেটে ছোট করা থাকবে।

---

## 10. DNS

Zone আছে **Squarespace**-এ, Custom Records-এর নিচে যোগ করতে হবে।
**পুরনো কিছুতে হাত দেওয়া যাবে না**, বিশেষ করে apex record, `www` CNAME আর MX record।

| Type | Host | Value |
|:---:|---|---|
| CNAME | `hostproposal` | নতুন container-এর নিজের Vercel Domains স্ক্রিন থেকে। শেষের ডট সহ হুবহু কপি। |
| MX | `send` | Resend থেকে। Region অনুযায়ী আলাদা। |
| TXT | `send` | SPF, Resend থেকে। |
| TXT | `resend._domainkey.send` | DKIM, Resend থেকে। (**section 14.13 দেখুন**) |
| TXT | `_dmarc` | `p=none` + একটা reporting ঠিকানা, যদি আগে থেকে না থাকে। |

**তিনটা জিনিস মাথায় রাখতে হবে:**

1. **Vercel প্রতিটা container-কে আলাদা CNAME target দেয়।** `www` যেখানে দেখাচ্ছে
   সেই value কপি করা যাবে না। ওটাও Vercel-এই যায়, দেখতে ঠিক লাগে, কিন্তু ওটা
   মার্কেটিং container-কে চেনায়। ফলাফল একটা 404, যেটা দেখে মনে হয় DNS-এর সমস্যা।
2. **Host ফিল্ডে শুধু label লিখতে হবে** (`hostproposal`, `send`), পুরো domain নয়।
   Squarespace নিজেই domain জুড়ে দেয়।
3. **Subdomain থেকে পাঠানো বাধ্যতামূলক, পছন্দের ব্যাপার নয়।** কারণ apex-এর SPF
   subdomain-কে cover করে না, আর **একটা domain-এ একটাই SPF record রাখা যায়**।
   Subdomain ব্যবহার করলে কোম্পানির আসল email-এর SPF record-এ হাত দিতে হয় না।

**শুরু করার আগে:** nameserver lookup করে নিশ্চিত হতে হবে Squarespace-ই authoritative,
এবং কোনো CAA record আছে কি না দেখতে হবে যা Let's Encrypt-কে certificate দিতে বাধা দেবে।

---

## 11. সিকিউরিটি নীতি

- **কোনো enumeration নেই।** Member আর non-member-এর জন্য status, body, timing এক।
- প্রতিটা response-এ `noindex` robots header আর `no-store` cache header। `robots.txt`
  সব disallow করবে।
- দুইটা POST endpoint-এই **Origin বা Referer চেক**, SameSite-এর অতিরিক্ত হিসেবে।
- Code এবং bearer token, দুটোরই **constant time comparison**।
- Ungated `/assets/` ফোল্ডারে **শুধু পাবলিক ব্র্যান্ড ফাইল**।
- **EVpin import-এর সিদ্ধান্ত বাকি** (section 14.17 দেখুন)।

---

## 12. Environment Variables

| Variable | লাগবে? | কাজ |
|---|:---:|---|
| `GATE_SECRET` | হ্যাঁ | Session cookie sign করে, code hash-এ salt দেয়। 64 অক্ষরের hex। |
| `RESEND_API_KEY` | হ্যাঁ | Email পাঠানোর জন্য। |
| `MAIL_FROM` | হ্যাঁ | Send subdomain-এর পাঠানোর পরিচয়। |
| `MAIL_REPLY_TO` | হ্যাঁ | Monitored inbox। |
| `KV_REST_API_URL` | হ্যাঁ | KV store। (**section 14.1 দেখুন**) |
| `KV_REST_API_TOKEN` | হ্যাঁ | KV store। (**section 14.1 দেখুন**) |
| `ALLOWLIST_API_URL` | Phase 2 | Dashboard-এর member endpoint। |
| `ALLOWLIST_API_TOKEN` | Phase 2 | উপরেরটার bearer token। |
| `FALLBACK_ALLOWLIST` | Phase 1 | Comma দিয়ে আলাদা করা email, API URL না থাকলে এটাই ব্যবহার হবে। |
| `SESSION_TTL_DAYS` | না | ডিফল্ট 7। |
| `OTP_TTL_SECONDS` | না | ডিফল্ট 600। |

কোনো required variable না থাকলে **503 + plain text কারণ**।

> **মনে রাখতে হবে:** Vercel-এ variable deploy-এর সময় bake হয়ে যায়। Variable সেট
> করার **আগে** deploy হওয়া container ভাঙা অবস্থাতেই থাকবে যতক্ষণ না আবার redeploy
> করা হয়। তাই ক্রম হলো: আগে variable, পরে redeploy।

---

## 13. Acceptance, অর্থাৎ কাজ শেষ হয়েছে কীভাবে বুঝব

- [ ] Subdomain-এ request করলে লগইন স্ক্রিন আসে, কখনো অ্যাপ্লিকেশন নয়।
- [ ] `js/model.js` সরাসরি চাইলে কোনো JavaScript আসে না।
- [ ] Member 30 সেকেন্ডের মধ্যে code পায় এবং সেটা দিয়ে টুলে ঢুকতে পারে।
- [ ] Non-member কোনো email পায় না, আর তার response member-এর থেকে আলাদা করা যায় না।
- [ ] 5 বার ভুল code দিলে ওই code আর কাজ করে না।
- [ ] 10 মিনিট পরে code কাজ করে না। ব্যবহার হয়ে যাওয়া code আবার ব্যবহার করা যায় না।
- [ ] Dashboard থেকে সরালে 5 মিনিটের মধ্যে অ্যাক্সেস বন্ধ, redeploy ছাড়াই।
- [ ] `GATE_SECRET` বদলালে সবাই সাথে সাথে সাইন আউট।
- [ ] কোনো required variable না থাকলে 503 আসে, খোলা সাইট নয়।
- [ ] Dashboard outage simulate করলে চালু session বন্ধ হয় না, আর cache গরম থাকলে
      নতুন সাইন ইনও আটকায় না।
- [ ] লঞ্চের দুই সপ্তাহ পরে Google-এ subdomain-টা index হয়নি।

---

## 14. PRD-র যেসব জায়গা খাপে খাপ মেলে না

আমি PRD-টা কোডের সাথে মিলিয়ে দেখেছি (`middleware.ts`, `index.html`, `DEPLOY.md`,
`README.md`, `js/evpin.js`)। নিচের জিনিসগুলো কাজ শুরুর আগে ঠিক করা দরকার।

### ব্লকিং, শুরুর আগেই সমাধান লাগবে

**14.1 — `Vercel KV` নামে এখন আর কোনো প্রোডাক্ট নেই।**
Vercel তাদের ডকুমেন্টেশনে পরিষ্কার লিখেছে: *"The Vercel Postgres and Vercel KV
products have been deprecated and are no longer supported... those moving from
Vercel KV should transition to Upstash Redis."* অর্থাৎ নতুন প্রজেক্টে "Vercel KV
store" বানানোই যাবে না। এখন Vercel Marketplace থেকে **Upstash Redis** integration
নিতে হয়। PRD-র env variable টেবিলে `KV_REST_API_URL` / `KV_REST_API_TOKEN` লেখা
আছে, কিন্তু Upstash integration সাধারণত `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN` নামে variable inject করে।
**করণীয়:** store-টা আগে বানিয়ে দেখতে হবে Vercel বাস্তবে কোন নামগুলো inject করছে,
তারপর PRD-র টেবিল সেই অনুযায়ী ঠিক করতে হবে। ধরে নিয়ে কোড লিখলে deploy-এর দিন ভাঙবে।

**14.2 — "ইন্টারফেসে কোনো পরিবর্তন নেই" কথাটা ভুল।**
`index.html`-এর 31 নম্বর লাইনে আছে:
```html
<a class="btn ghost sm signout" href="/__logout" title="End this session on this device">Sign out</a>
```
এটা একটা **GET link**, আর ঠিকানা `/__logout`। নতুন spec-এ logout হলো
**`/api/auth/logout`, POST**। অর্থাৎ Sign out বোতামটা কাজ করা বন্ধ করে দেবে।
**করণীয়:** হয় `index.html`-এ ওই এক লাইন বদলাতে হবে (একটা ছোট `fetch` POST সহ),
নয়তো `/api/auth/logout`-কে GET-ও গ্রহণ করতে হবে। যেটাই হোক, PRD-র "no change to
the interface" দাবিটা লিখিতভাবে সংশোধন করা দরকার, যাতে পরে কেউ বলতে না পারে scope
বেড়ে গেছে।

**14.3 — "Timing এক থাকবে" জিনিসটা যেভাবে লেখা আছে সেভাবে সম্ভব নয়।**
Member-এর ক্ষেত্রে সার্ভার একটা KV write করে **এবং Resend-এ একটা HTTP call** করে,
যেটায় কয়েকশো মিলিসেকেন্ড লাগে। Non-member-এর ক্ষেত্রে কিছুই হয় না, উত্তর সাথে সাথে
চলে যায়। Status আর body এক থাকলেও **স্টপওয়াচ ধরলে দুইটা আলাদা করা যাবে**, আর তাতেই
enumeration protection-টা ফেঁসে যায়।
**করণীয়:** PRD-তে পদ্ধতিটা স্পষ্ট করে লিখতে হবে। সবচেয়ে পরিষ্কার উপায় হলো **আগে
response পাঠিয়ে দেওয়া, তারপর background-এ email পাঠানো** (Vercel-এ
`context.waitUntil()`)। বিকল্প হলো দুই পথকেই একটা নির্দিষ্ট সময় পর্যন্ত অপেক্ষা
করানো। এটা লিখে না দিলে ডেভেলপার স্বাভাবিকভাবেই await করে ফেলবে, আর acceptance
criteria-টা কাগজে পাস করলেও বাস্তবে ফেল করবে।

**14.4 — DNS টেবিলে `_vercel` verification TXT record নেই।**
`wattupusa.com` যদি একটা Vercel account/team-এ থাকে আর নতুন container যদি **অন্য
account-এ** বানানো হয়, তাহলে Vercel domain ownership verify করতে একটা `_vercel`
TXT record চাইবে। সেটা PRD-র DNS টেবিলে নেই। এর মানে হলো **Open C (কোন Vercel
account container-টা রাখবে) প্রশ্নটার উত্তর DNS-এর কাজ শুরুর আগেই লাগবে**, পরে নয়।
PRD-তে Open C-কে অন্য open প্রশ্নগুলোর সাথে একই সারিতে রাখা হয়েছে, কিন্তু এটা আসলে
DNS-এর precondition।

### ভেতরের পরস্পরবিরোধিতা

**14.5 — Sign-in log নিজের নিয়ম নিজেই ভাঙছে।**
Email section-এ লেখা: *"Email addresses in logs are hashed or truncated."*
কিন্তু KV টেবিলে `signin:{date}`-এ রাখা হচ্ছে *"email, time, IP, user agent"*,
অর্থাৎ কাঁচা email। দুটো একসাথে সত্যি হতে পারে না। Hash করলে log-টা "কে ঢুকেছিল"
প্রশ্নের উত্তর দিতে পারবে না, যেটাই তার একমাত্র উদ্দেশ্য।
**করণীয়:** ঠিক করতে হবে audit log এই নিয়মের ব্যতিক্রম (এবং সেটা লিখে রাখতে হবে),
নাকি log-এও hash যাবে। সাথে এটাও ভাবা দরকার যে email + IP + user agent 90 দিন
রাখা মানে personal data রাখা, আর KV-তে কার অ্যাক্সেস আছে সেটা PRD-তে কোথাও বলা নেই।

**14.6 — `signin:{date}` কী-তে "append only" কাজ করবে না।**
একটা তারিখে একটাই key, আর তাতে বারবার যোগ করা। সাধারণ GET-তারপর-SET দিয়ে করলে
দুইজন একসাথে সাইন ইন করলে একজনের entry হারিয়ে যাবে (race condition)।
**করণীয়:** Redis-এর `LPUSH` + `EXPIRE` ব্যবহার করতে হবে, অথবা প্রতিটা event-এর
জন্য আলাদা key। PRD-তে structure-টার নাম লিখে দেওয়া উচিত, নাহলে read-modify-write
হিসেবেই বানানো হবে।

**14.7 — "5 মিনিটে revocation" আর "24 ঘণ্টার পুরনো cache" পরস্পরবিরোধী।**
Acceptance-এ শর্তহীনভাবে লেখা আছে *"Dashboard removal revokes access within 5
minutes"*। কিন্তু caching নিয়মে বলা আছে dashboard ডাউন থাকলে 24 ঘণ্টা পর্যন্ত
পুরনো cache serve করা হবে। তার মানে outage চলাকালে revocation-এ 24 ঘণ্টা পর্যন্ত
লাগতে পারে। দুটোই যুক্তিসঙ্গত সিদ্ধান্ত, কিন্তু acceptance লাইনটায়
*"dashboard যতক্ষণ পৌঁছানো যাচ্ছে"* শর্তটা যোগ করা দরকার।

### যেসব জিনিস PRD-তে নেই, ফলে ভুলভাবে বানানো হবে

**14.8 — `verify-otp` ব্যর্থ হলে কী response যাবে, কোথাও লেখা নেই।**
Routes টেবিলে শুধু সফল ক্ষেত্রটা আছে। কিন্তু ভুল code, মেয়াদোত্তীর্ণ code, code-ই
তৈরি হয়নি, আর 5 বার চেষ্টা শেষ, এই চারটা ক্ষেত্রের উত্তর **অবশ্যই একরকম হতে হবে**।
না হলে "এই email-এর জন্য কোনো code ইস্যু হয়নি" আর "code ভুল" আলাদা করা যাবে, আর
তাতে **ধাপ 1-এ যে enumeration বন্ধ করা হলো সেটা ধাপ 2-এ খুলে যাবে।** এটা একটা
বাস্তব ফাঁক, অনুমানের বিষয় নয়।

**14.9 — `/login` স্ক্রিনটা আসলে কোথায় থাকবে?**
এটা একটা framework ছাড়া static সাইট, কোনো build step নেই। এখনকার লগইন পাতাটা
`middleware.ts`-এর ভেতরে একটা HTML string হিসেবে আছে। নতুন দুই ধাপের স্ক্রিনটা কি
আবারও middleware থেকে generate হবে, নাকি একটা static `login.html` ফাইল হবে?
**উত্তরের উপর matcher-এর exclusion আর রুটের নাম দুটোই নির্ভর করছে**, তাই কোড লেখার
আগেই ঠিক করা দরকার।

**14.10 — প্রজেক্টটা আর "শুধু static" থাকছে না, এটা PRD কোথাও বলেনি।**
`DEPLOY.md`-তে গর্ব করে লেখা আছে *"no framework, no build step, no database and no
backend API"*। কিন্তু `/api/auth/*` মানে Vercel Functions, আর `resend` ও Redis
client মানে `package.json`-এ আসল dependency, মানে Vercel এখন `npm install` চালাবে।
এটা করা যাবে, সমস্যা নেই, কিন্তু **এটা একটা scope পরিবর্তন যা PRD আড়াল করে রেখেছে**।
`DEPLOY.md` আর `README.md` দুটোই সেই অনুযায়ী আপডেট করতে হবে।

**14.11 — Cutover-এর দিন সবাই হঠাৎ সাইন আউট হয়ে যাবে।**
পুরনো cookie-র নাম `wu_gate`, নতুনটা `wu_session`। তাই পুরনো cookie আর যাচাই হবে না
এবং সবাই `/login`-এ চলে যাবে। আচরণটা ঠিকই আছে, কিন্তু **PRD-তে এটা লেখা নেই এবং
টিমকে আগেই জানিয়ে রাখা দরকার**, নাহলে লঞ্চের দিন "সাইট ভেঙে গেছে" বলে ফোন আসবে।

**14.12 — প্রতিটা request-এ allowlist যাচাই করা ব্যয়বহুল।**
`index.html` একবার লোড হলে 4টা JS + 1টা CSS ফাইল চায়, সবগুলোই গেটেড। মানে প্রতি
পেজ লোডে 5টা KV round trip। **নিয়মটা ঠিক আছে (section 6 দেখুন), কিন্তু হুবহু এভাবে
বানালে প্রতিটা পেজ লোডে বাড়তি latency আর KV খরচ যোগ হবে।**
**করণীয়:** edge isolate-এ কয়েক সেকেন্ডের একটা in-memory memo রাখা, অথবা cookie-তে
"সর্বশেষ কখন যাচাই হয়েছে" রেখে নির্দিষ্ট বিরতিতে যাচাই করা। নিরাপত্তা একই থাকে,
খরচ কমে।

### ছোট, কিন্তু ঠিক করে নেওয়া ভালো

**14.13 — DKIM record-এর ধরন সম্ভবত TXT নয়, CNAME।**
PRD বলছে `TXT | resend._domainkey.send`। কিন্তু Resend-এর বর্তমান domain API
response-এ DKIM আসে **তিনটা CNAME record** হিসেবে
(`<selector>._domainkey` → `<selector>.dkim.amazonses.com`)। Resend অতীতে দুই
রকম shape-ই ব্যবহার করেছে, আর এটা account ও region ভেদে আলাদা হতে পারে।
**করণীয়:** PRD-র টেবিল থেকে record type কপি করা যাবে না। **Resend dashboard এই
domain-টার জন্য যা দেখাবে, হুবহু সেটাই বসাতে হবে।** টেবিলে "TXT" লেখা থাকায়
DNS-এর কাজ যিনি করবেন তিনি ভুল ধরনের record বানিয়ে ফেলতে পারেন। (MX আর SPF
সারি দুটো অবশ্য ঠিক আছে, যাচাই করে দেখেছি।)

**14.14 — Hash-টা HMAC হওয়া উচিত।**
`sha256(code + email + GATE_SECRET)`-এর বদলে `GATE_SECRET` দিয়ে keyed
**HMAC-SHA256** ব্যবহার করাই প্রচলিত এবং নিরাপদ, length extension সংক্রান্ত
প্রশ্ন এড়ানো যায়। কোডের অন্য জায়গায় (session cookie) এমনিতেই HMAC ব্যবহার হচ্ছে।

**14.15 — `GATE_SECRET` দুটো কাজ একসাথে করছে।**
এটা session sign করে **এবং** code hash-এ salt দেয়। ফলে break glass হিসেবে rotate
করলে চলমান সব OTP-ও বাতিল হয়ে যাবে। মেনে নেওয়ার মতো, কিন্তু লিখে রাখা দরকার:
অফিস সময়ে rotate করলে যারা মাঝপথে সাইন ইন করছিল তাদের নতুন code চাইতে হবে।

**14.16 — Origin/Referer চেক Vercel preview deployment-এ আটকে দেবে।**
প্রতিটা preview deployment-এর URL আলাদা। চেকটা যেন চলতি host-কে মেনে নেয়,
নাহলে preview-তে কেউ লগইন করতে পারবে না।

**14.17 — EVpin proxy: আমার সুপারিশ।**
`js/evpin.js`-এর 8-9 নম্বর লাইনে `r.jina.ai` আর `api.allorigins.win` ব্যবহার হচ্ছে,
কারণ EVpin CORS header পাঠায় না। **এই দুটো তৃতীয় পক্ষের সার্ভিস প্রতিটা জমা দেওয়া
URL দেখতে পায়।** আগে ব্যাপারটা যতটা গুরুতর ছিল, এখন আরও বেশি, কারণ এখন প্রতিটা
ব্যবহারকারীর আলাদা পরিচয় আছে এবং sign-in log রাখা হচ্ছে।
**সুপারিশ:** যেহেতু `api/` ফোল্ডার এমনিতেই যোগ হচ্ছে, একটা গেটেড first party
proxy endpoint বানিয়ে ফেলা হোক (`api/evpin-fetch`), আর `evpin.js`-এর উপরের
`EVPIN_READERS` লিস্টটা সেদিকে পয়েন্ট করানো হোক। **`DEPLOY.md`-তে ওই লিস্টটাকেই
ইচ্ছাকৃত swap point হিসেবে লেখা আছে**, তাই এটা কোনো hack নয়। খরচ আনুমানিক 30 লাইন
কোড, আর বিনিময়ে তৃতীয় পক্ষ পুরোপুরি বাদ যায়।

**14.18 — "Google-এ index হয়নি" জিনিসটা acceptance test নয়।**
এটা build-এর সময় চালানো যায় না, আর এটা Google-এর উপর নির্ভরশীল, আমাদের উপর নয়।
সাইটটা কোথাও link না করা থাকলে এমনিতেই সত্যি হবে। এটাকে **লঞ্চ পরবর্তী চেক**
হিসেবে আলাদা করে রাখা উচিত, acceptance gate হিসেবে নয়। একইভাবে "30 সেকেন্ডে code
পৌঁছাবে" Resend আর গ্রহীতার mail server-এর উপর নির্ভর করে, এটা লক্ষ্য হিসেবে ঠিক
আছে কিন্তু pass/fail gate হিসেবে নয়।

**14.19 — "Code আর retry করা যাবে না" কথাটা অস্পষ্ট।**
5 বার ভুল হলে key ডিলিট হয়, অর্থাৎ **ওই code**-টা আর কাজ করবে না। কিন্তু ব্যবহারকারী
নতুন একটা code চাইতে পারবে (60 সেকেন্ড gap আর ঘণ্টায় 5 বারের সীমা মেনে)। Acceptance
লাইনটায় এটা স্পষ্ট করে লেখা দরকার।

---

## 15. দুইটা বিষয় যা কাজ শুরুর আগেই নিশ্চিত হতে হবে

**A. Subdomain-এর বানান (PRD-র Open B)।**
আমি মিলিয়ে দেখেছি, দ্বন্দ্বটা সত্যি:
- `DEPLOY.md` 3 নম্বর লাইন: **hlproposal**.wattupusa.com
- `README.md`-এর heading: "Deploying to **hlproposal**.wattupusa.com"
- PRD: **hostproposal**.wattupusa.com

ক্লায়েন্ট বলেছে `hostproposal`। **DNS record বসানোর আগে এটা লিখিতভাবে নিশ্চিত করতে
হবে।** `hostproposal` চূড়ান্ত হলে `DEPLOY.md` আর `README.md` দুটোই আপডেট করতে হবে।
**কোনো কোড বদলাতে হবে না**, কারণ লগইন স্ক্রিন `/assets/...` absolute path ব্যবহার
করে যা যেকোনো subdomain-এ কাজ করে।

**B. Dashboard-এর member endpoint (PRD-র Open A)।**
Dashboard টিমকে section 5-এর contract অনুযায়ী endpoint বানাতে হবে।
**কিন্তু কেউ এর জন্য অপেক্ষা করবে না।** Phase 1 `FALLBACK_ALLOWLIST` দিয়ে এগোবে,
পরে শুধু `ALLOWLIST_API_URL` আর `ALLOWLIST_API_TOKEN` যোগ করলেই Phase 2 চালু।

### PRD-র বাকি open প্রশ্নগুলো
- **C. কোন Vercel account নতুন container-টা রাখবে?**
  → section 14.4 অনুযায়ী **এটার উত্তর DNS-এর কাজের আগেই লাগবে**।
- **D. Code email-এর Reply-To ঠিকানা কী হবে?** একটা monitored inbox লাগবে।
- **E. Sign-in log কি dashboard-এ দেখা যাবে, নাকি শুধু log-এ থাকবে?**
  → section 14.5-এর email hashing প্রশ্নটার সাথে এটা জড়িত।

---

## 16. কাজের প্রস্তাবিত ক্রম

| ধাপ | কাজ | কার উপর নির্ভরশীল |
|:---:|---|---|
| 1 | Subdomain-এর বানান নিশ্চিত করা, Vercel account ঠিক করা | ক্লায়েন্ট (15.A, Open C) |
| 2 | Upstash Redis store তৈরি, বাস্তবে inject হওয়া env variable-এর নাম লিখে রাখা | 14.1 |
| 3 | Resend-এ domain যোগ, dashboard যে DNS record দেখাবে হুবহু সেগুলো নেওয়া | 14.13 |
| 4 | DNS record বসানো (CNAME + Resend-এর record + দরকার হলে `_vercel` TXT) | ধাপ 1, 2, 3 |
| 5 | PRD-র অস্পষ্টতাগুলো সমাধান: 14.3 timing, 14.8 verify failure, 14.9 login পাতা কোথায়, 14.5 log-এ email | ক্লায়েন্ট + টিম |
| 6 | গেট বানানো: middleware, `/login`, তিনটা auth route, KV helper, Resend helper | ধাপ 2, 5 |
| 7 | `index.html`-এর Sign out লাইন ঠিক করা | 14.2 |
| 8 | `SITE_PASSWORD` আর তার পুরো কোডপথ মুছে ফেলা | ধাপ 6 |
| 9 | `DEPLOY.md` আর `README.md` আপডেট (subdomain, build step, env variable) | 14.10, 15.A |
| 10 | Acceptance checklist (section 13) ধরে ধরে পরীক্ষা | সব |
| 11 | Phase 2: dashboard endpoint এলে দুইটা env variable যোগ করা | Dashboard টিম |

---

## 17. এক নজরে মনে রাখার মতো কথা

1. **টুলের ভেতরে কিছু বদলাচ্ছে না।** শুধু সামনের দরজা বদলাচ্ছে। ব্যতিক্রম একটাই:
   Sign out লিংকের এক লাইন (14.2)।
2. **সবকিছুর মূল উদ্দেশ্য একটাই:** dashboard থেকে নাম কাটলেই 5 মিনিটে অ্যাক্সেস বন্ধ,
   ডেভেলপারকে না ডেকে।
3. **Member আর non-member-এর উত্তর হুবহু এক**, সময় সহ। এটাই spec-এর সবচেয়ে কড়া শর্ত,
   এবং এখানেই ভুল হওয়ার সম্ভাবনা সবচেয়ে বেশি (14.3, 14.8)।
4. **সন্দেহ হলে বন্ধ করে দাও।** কনফিগ নেই → 503। Cache নেই আর dashboard ডাউন → 503।
   কখনোই খোলা সাইট নয়।
5. **`middleware.ts` root-এ**, নাহলে পুরো সাইট নীরবে উন্মুক্ত হয়ে যাবে।
6. **Phase 1 কারও জন্য অপেক্ষা করে না।** Dashboard endpoint ছাড়াই আজ লঞ্চ করা যায়।
