# Austrian Flood Monitoring and Emergency Response System (Frontend)

**Contributors:** [@nevinjoseph01](https://github.com/nevinjoseph01), [@Oipipa](https://github.com/Oipipa), [@bOti234](https://github.com/bOti234), [@MarioP03](https://github.com/MarioP03), [@Faisal-Khan123](https://github.com/Faisal-Khan123)  

This is the **frontend repository** for the Austrian Flood Monitoring and Emergency Response System. The platform helps monitor flooding events, visualize water levels, and allow users to report emergency situations.  

**Tech Stack:**  
- Angular  
- TypeScript  
- Leaflet (for maps)  
- HTML & CSS  

## Features  
- **Interactive Map**  – View current water levels, flood alerts, and community reports.  
- **Historical Data**  – Check past water levels and trends.  
- **User Registration & Login** – Sign up, verify your email, and access features.  
- **Community Reports**  – Submit flood reports with location pins.  
- **Emergency Contacts** – Access important contact numbers.  

## What Can Users Do?  
- Explore a **map of Austria** showing **real-time water levels** and **flood alerts**.  
- Click on water level markers for **detailed data and historical trends**.  
- View **community flood reports** on the map and as a list.  
- **Register & login**, then submit personal flood reports with a **location pin**.  
- Access a **feed of community reports** and emergency **contact information**.  

## Getting Started  

### Installation  
```bash
git clone https://github.com/nevinjoseph01/flood-monitoring-frontend.git
cd flood-monitoring-frontend
npm install
```

### Run the Development Server  
```bash
ng serve
```
Then visit: **`http://localhost:4200/`**

## Notes  
- This repo is for **frontend only**.
- The backend is built using **Node.js, Express, and MongoDB** but is not included here.  
- Admin/moderator features (task creation, verification, etc.) are not included here.  
- Reports submitted by users appear as *pending* until verified.  
