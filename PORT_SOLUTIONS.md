# Port 3000 Already in Use - Solutions

## 🔧 Quick Fixes

### **Option 1: Kill the Process (What we just did)**
```bash
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID [PID] /F
```

### **Option 2: Change the Port**
Edit `server.js` and change the port:

```javascript
// Change this line in server.js
const PORT = process.env.PORT || 3001; // Changed from 3000 to 3001
```

### **Option 3: Use a Different Port via Environment**
```bash
# Set environment variable
set PORT=3001
npm run dev
```

### **Option 4: Find and Kill All Node Processes**
```bash
# Kill all Node.js processes
taskkill /IM node.exe /F
```

## 🚀 Alternative Ports

If port 3000 is busy, try these common alternatives:
- **3001** - Most common alternative
- **3002** - Another good option
- **8080** - Standard web port
- **5000** - Development port
- **8000** - Alternative development port

## 🔍 How to Check What's Using Port 3000

### **Windows:**
```bash
netstat -ano | findstr :3000
```

### **Mac/Linux:**
```bash
lsof -i :3000
```

## ✅ Verification

After fixing the port issue:
1. Server should start without errors
2. You should see: `Server running on port 3000` (or your chosen port)
3. Access your app at: `http://localhost:3000`

## 🚨 Common Causes

- **Previous server instance** still running
- **Other development servers** (React, Vue, etc.)
- **Background processes** using the port
- **Multiple terminal windows** running the same server

## 💡 Prevention Tips

1. **Always stop servers** with Ctrl+C before restarting
2. **Use different ports** for different projects
3. **Check for running processes** before starting new servers
4. **Use process managers** like PM2 for production 