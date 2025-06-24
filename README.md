# 🎤 VOXTA – Voice Agent for Real-Time Auction Bidding

Voxta is a voice-based intelligent auction agent built for fast-paced online auctions. It allows users to participate in auctions via voice commands in real time, eliminating the need for manual input and enhancing accessibility for all.

---

## 🧠 Problem Statement

Online auctions move fast — bids change in seconds, and users often miss out due to slow reaction times, complex interfaces, or limited accessibility. Voxta solves this by offering a seamless **voice-first auction experience** through phone-based interaction powered by AI.

---

## 🚀 Features

- 🔊 **Intuitive Voice Bidding**  
  Users can place bids during a phone call using natural voice commands.

- 📢 **Real-Time Auction Monitoring**  
  Get live updates on current highest bids, items, and time remaining.

- 📈 **On-Demand Auction Reporting**  
  Instantly query for bid counts, highest bids, and auction item status.

- ✅ **Intelligent Bid Validation**  
  Ensures only valid bids (higher than current highest) are accepted.

- 🖥️ **Web Dashboard**  
  Complementary React UI for browsing auction items and manual bidding.

---

## 🛠️ Tech Stack

| Layer                 | Tools/Tech Used                         |
|-----------------------|------------------------------------------|
| Voice Agent           | OmniDimension AI                        |
| Frontend              | React.js + Tailwind CSS                 |
| Backend               | Node.js, Express.js, Python (NLU/STT)   |
| Database              | MongoDB                                 |
| Deployment            | Vercel                                  |

---

## 🧱 System Architecture

1. **Frontend:** A web interface shows live auctions, built using React + Tailwind.
2. **Voice Agent:** OmniDimension handles real-time voice input/output.
3. **Backend:** Express API routes validate and store bids, handle item data.
4. **Database:** MongoDB stores auctions, bid history, and user interaction logs.

---
