# Connection Refused (ECONNREFUSED) - Troubleshooting Guide

## Understanding the Error

**Error Code:** `ECONNREFUSED`  
**Target:** `192.168.60.16:3003`  
**Meaning:** The target machine actively refused the connection attempt

## What is ECONNREFUSED?

`ECONNREFUSED` occurs when:
- Your application tries to connect to a server
- The server receives the connection request
- **But the server actively rejects it** (no service is listening on that port)

This is different from:
- **ETIMEDOUT**: Connection attempt times out (network issue, firewall blocking)
- **ENOTFOUND**: DNS resolution failed (hostname doesn't exist)
- **EHOSTUNREACH**: No route to host (network routing problem)

## Common Causes & Solutions

### 1. **Service Not Running** ⚠️ (Most Common)
**Problem:** The transaction service on `192.168.60.16:3003` is not running.

**Check:**
```bash
# On the target machine (192.168.60.16)
# Check if service is running
netstat -an | grep 3003
# or
ss -tuln | grep 3003
# or
lsof -i :3003
```

**Solution:**
- Start the transaction service
- Check service status: `systemctl status <service-name>` (Linux)
- Check if it crashed: Review service logs

---

### 2. **Service Listening on Wrong Interface**
**Problem:** Service is bound to `127.0.0.1` (localhost only) instead of `0.0.0.0` (all interfaces).

**Check:**
```bash
# On target machine
netstat -an | grep 3003
# If you see: 127.0.0.1:3003 → Only local connections
# Should see: 0.0.0.0:3003 or :::3003 → All interfaces
```

**Solution:**
- Configure service to listen on `0.0.0.0:3003` or `192.168.60.16:3003`
- Not just `localhost` or `127.0.0.1`

---

### 3. **Firewall Blocking Port**
**Problem:** Firewall on target machine or network is blocking port 3003.

**Check:**
```bash
# On target machine (Windows)
netsh advfirewall firewall show rule name=all | findstr 3003

# On target machine (Linux)
sudo ufw status
sudo iptables -L -n | grep 3003
```

**Solution:**
- Open port 3003 in firewall
- Windows: Add firewall rule for port 3003
- Linux: `sudo ufw allow 3003` or configure iptables

---

### 4. **Wrong Port Number**
**Problem:** Service is running on a different port.

**Check:**
```bash
# On target machine - find what ports are listening
netstat -tuln | grep LISTEN
# or
ss -tuln
```

**Solution:**
- Verify correct port in environment variables
- Update `TXN_PORT` if needed

---

### 5. **Network Connectivity Issues**
**Problem:** Cannot reach the target machine at all.

**Check:**
```bash
# From your machine
ping 192.168.60.16
telnet 192.168.60.16 3003
# or
nc -zv 192.168.60.16 3003
```

**Solution:**
- Verify network connectivity
- Check if machines are on same network
- Check VPN connection if required

---

### 6. **Service Crashed or Restarting**
**Problem:** Service was running but crashed or is restarting.

**Check:**
- Service logs on target machine
- Process manager (PM2, systemd, etc.)
- Application crash logs

**Solution:**
- Restart the service
- Check for errors in service logs
- Investigate why it crashed

---

## Diagnostic Steps

### Step 1: Test Basic Connectivity
```bash
# From your development machine
ping 192.168.60.16
```

### Step 2: Test Port Connectivity
```bash
# Windows PowerShell
Test-NetConnection -ComputerName 192.168.60.16 -Port 3003

# Linux/Mac
telnet 192.168.60.16 3003
# or
nc -zv 192.168.60.16 3003
```

### Step 3: Check Service Status (on target machine)
```bash
# If using systemd
systemctl status <service-name>

# If using PM2
pm2 list
pm2 logs

# Check if port is listening
netstat -an | grep 3003
```

### Step 4: Use Built-in Diagnostic
The application now includes a diagnostic endpoint. You can call it to get detailed connection information.

---

## Environment Variables Check

Verify your `.env` file has correct values:
```env
DB_HOST=192.168.60.16
TXN_PORT=3003
```

**Note:** `DB_HOST` is being used for the transaction API URL, which might be confusing. Consider using a separate variable like `TXN_API_HOST`.

---

## Quick Fixes to Try

1. **Restart the transaction service** on `192.168.60.16`
2. **Check service logs** for errors
3. **Verify firewall rules** allow port 3003
4. **Test from command line:**
   ```bash
   curl http://192.168.60.16:3003/api/transactionDetails/test/test
   ```
5. **Check if service is listening on correct interface:**
   - Should be `0.0.0.0:3003` (all interfaces)
   - Not `127.0.0.1:3003` (localhost only)

---

## Prevention

1. **Add connection retry logic** with exponential backoff
2. **Implement health checks** to monitor service availability
3. **Add timeout configuration** for fetch requests
4. **Use connection pooling** if applicable
5. **Monitor service health** with alerts

---

## Code Improvements Made

✅ Added try-catch error handling  
✅ Enhanced error messages with diagnostic information  
✅ Created connection diagnostic utility  
✅ Added troubleshooting tips in error responses  

The application will now:
- Not crash when connection fails
- Return helpful error messages
- Provide troubleshooting guidance
- Log detailed error information

---

## Next Steps

1. **Verify service is running** on `192.168.60.16:3003`
2. **Check firewall rules** on target machine
3. **Review service configuration** to ensure it listens on all interfaces
4. **Test connectivity** using diagnostic tools
5. **Check service logs** for any startup errors

---

## Need More Help?

If the issue persists:
1. Check service logs on `192.168.60.16`
2. Verify network configuration
3. Test with a simple curl request
4. Contact network/system administrator
5. Review service documentation
