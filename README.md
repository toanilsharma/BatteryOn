
# Global Industrial Battery Health & Compliance Analyzer

## 1. System Overview
This is an offline-capable, air-gapped engineering tool for diagnosing industrial battery systems (Stationary, Grid, Traction). It supports all major chemistries (Lithium, Lead-Acid, Nickel, Flow) and analyzes data against IEC/IEEE standards.

## 2. Commissioning & Setup

### A. Local Development
1. **Install Dependencies:**
   ```bash
   npm install
   cd server && npm install
   ```
2. **Start Frontend (Vite):**
   ```bash
   npm run dev
   ```
3. **Start Backend (Optional for Offline Mode):**
   ```bash
   node server/server.js
   ```

### B. Docker Deployment (Air-Gapped)
1. Build the image:
   ```bash
   docker build -t power-safe-analytics .
   ```
2. Run the container:
   ```bash
   docker run -p 3001:3001 -v $(pwd)/data:/app/data power-safe-analytics
   ```
3. Access at `http://localhost:3001`

## 3. Usage Guide

### Data Input Formats
- **Voltage Log (.csv):** Must contain `Cell_ID`, `Voltage_V`. Optional: `Temperature_C`.
- **Capacity Test (.csv):** Must contain `Cell_ID`, `Rated_Ah`, `Measured_Ah`.

### Compliance Checks
The system automatically maps results to:
- **IEC 60896-11/21/22:** Stationary Lead-Acid
- **IEC 62619:** Industrial Lithium Safety
- **IEEE 450/1188:** Maintenance & Testing

## 4. Troubleshooting
- **Missing Columns:** Ensure CSV headers match the sample files exactly.
- **Offline Mode:** The React app functions fully in the browser. The backend is only required for centralized historical storage.

---
**Engineering Disclaimer:** This tool provides diagnostic insights based on statistical rules. It does not replace physical inspection by certified personnel.
