# 🚀 Pathify – Smarter Route Optimization  

Pathify is a route optimization platform designed to streamline delivery routes using **real-time communication**, **AI-powered decision-making**, and a **sleek, user-friendly interface**. Built during [**uOttaHacks7**](https://uottahacks.com/) (hosted by **uOttawa** and part of the [**Major League Hacking (MLH)**](https://mlh.io/) circuit), Pathify was a 36-hour hackathon project aimed at solving challenges in route efficiency for logistics and delivery systems.

---

## 📂 Features
- **Real-time Updates:** Live delivery data powered by [**Solace PubSub+**](https://solace.com/products/event-broker/pubsub-plus/) for seamless and responsive route management.  
- **AI Optimization:** [**GROQ AI**](https://groq.com/) dynamically adjusts routes based on traffic forecasts and road conditions.  
- **Scalable Backend:** [**Supabase**](https://supabase.com/) handles authentication, database storage, and route analytics with ease.  
- **User-Friendly Design:** A lovable and intuitive UI ensures that users can track and optimize routes in real time.  

---

## 💡 Technologies Used  

### 📨 [**Solace PubSub+**](https://solace.com/products/event-broker/pubsub-plus/):  
An event-driven messaging platform used to enable **real-time communication** between components. This allowed us to create a responsive system that updates route data dynamically as changes occur.  

### 🤖 [**GROQ AI**](https://groq.com/):  
We implemented GROQ AI to handle **traffic predictions and dataset analysis**, adding intelligence to our route prioritization algorithms. GROQ AI enabled smarter planning by processing large datasets efficiently and making real-time decisions.

### 🛠️ [**Supabase**](https://supabase.com/):  
Supabase served as the **backend** for Pathify, managing:  
- User authentication  
- Database storage for historical route analytics and user data  
- API calls to seamlessly integrate with the frontend  

### ❤️ **Lovable UI/UX:**  
Our objective was not just to create a functional platform but to make it **easy to use and enjoyable** for end-users. The UI was designed with simplicity and real-time interaction in mind.  

---

## 📋 How It Works  

1. **Real-Time Data Streaming:** Solace PubSub+ ensures instant communication between backend systems and the client-side application.  
2. **Predictive AI Optimization:** GROQ AI processes live and historical data, optimizing routes based on factors such as traffic and delivery priorities.  
3. **Backend Processing:** Supabase securely stores user data, delivery history, and route analytics while handling authentication.  
4. **User Interaction:** A simple interface allows end-users to view optimized routes and interact with live delivery updates.

---

## 🛠️ Installation and Setup  

If you’d like to run or contribute to Pathify, follow these steps:

### Prerequisites  
- [**Node.js**](https://nodejs.org/) (v18 or later)  
- [**Bun**](https://bun.sh/) (or npm/yarn)  
- [**Supabase account**](https://supabase.com/) for backend setup  
- [**Solace PubSub+ account**](https://console.solace.cloud/login/new-user) or equivalent messaging setup  

### Clone the Repository  
```bash
git clone https://github.com/[your-username]/pathify.git
cd pathify
```

### Install Dependencies  
Using Bun:  
```bash
bun install
```

Or, using npm:  
```bash
npm install
```

### Set Up Environment Variables  
Create a `.env` file in the root directory and add the following keys:  
```env
REACT_APP_SUPABASE_URL=<Your-Supabase-URL>
REACT_APP_SUPABASE_KEY=<Your-Supabase-API-Key>
REACT_APP_SOLACE_HOST=<Your-Solace-Host>
REACT_APP_SOLACE_PORT=<Your-Solace-Port>
```

### Start the Development Server  
Using Bun:  
```bash
bun run dev
```

Or, using npm:  
```bash
npm run dev
```

---

## 🚀 Future Enhancements  

- Integrating additional real-time APIs for weather data or emergency notifications.  
- Enhanced AI models for improving delivery delay predictions.  
- Support for multiple languages and regions.  

---

Feel free to fork, contribute, or get in touch if you’d like to collaborate on Pathify!  
