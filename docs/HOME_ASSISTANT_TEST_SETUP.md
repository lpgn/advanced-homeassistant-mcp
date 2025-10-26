# 🏠 Home Assistant MCP Test Environment Setup

## Summary of PR #14 Fixes Applied

✅ **Successfully merged PR #14 fixes for duplicate tool registration:**
- Removed duplicate tool files from `src/tools/` directory
- Added Tool object exports to homeassistant tools for FastMCP/stdio transport compatibility  
- Updated `src/tools/index.ts` to import from homeassistant directory
- Updated `src/index.ts` to filter out homeassistant tools to avoid duplicate registration
- Fixed circular dependency errors and tool registration conflicts

The MCP server is now ready for testing with both HTTP and stdio transports without conflicts!

---

## 🛠️ Part 1: Setting Up Home Assistant Test Container

### Prerequisites
- Visual Studio Code installed
- "Dev Containers" extension installed in VS Code
- Docker Desktop running

### Step 1: Clone Test Repository in Container

1. Open VS Code
2. Open Command Palette (View > Command Palette... or `Ctrl+Shift+P`)
3. Type and select "Dev Containers: Clone Repository in Container Volume..."
4. Paste this URL: `https://github.com/0GiS0/home-assistant-mcp`
5. VS Code will download the repository, build the Docker image, and start the container
   - This may take several minutes as it downloads Home Assistant

### Step 2: Configure Home Assistant Instance

1. Once the container is running, go to the "Ports" tab in VS Code terminal panel
2. You'll see port "8123" listed
3. Click the "Open in Browser" icon (globe icon) next to port 8123
4. This opens Home Assistant setup screen
5. Create a new user and password for your test instance
6. Complete the initial configuration steps

---

## 🔌 Part 2: Installing and Configuring MCP Server

### Step 1: Install MCP Integration

1. In your Home Assistant web interface, go to **Settings** > **Devices & Services**
2. Click **"Add Integration"** button (bottom right)
3. Search for "MCP"
4. Select "Model Context Protocol Server" and click "Submit"
5. The MCP server is now installed!

### Step 2: Create Long-Lived Access Token

1. In Home Assistant, click your user profile icon (bottom left)
2. Scroll down to "Long-Lived Access Tokens" section
3. Click **"Create Token"**
4. Give it a name (e.g., "MCP Server")
5. Click OK
6. **CRITICAL**: Copy this token immediately and save it securely - you won't see it again!

### Step 3: Configure VS Code MCP Connection

1. Back in VS Code (in the dev container), open the file explorer
2. Open the `mcp.json` file
3. You'll see a "Start" button above the configuration - click it
4. VS Code will prompt for two inputs:

   **Input 1 - Domain**: 
   - ❌ Wrong: `localhost:8123` or `https://localhost:8123` (this will fail)
   - ✅ Correct: `homeassistant` (the Docker service name)

   **Input 2 - Token**: 
   - Paste the Long-Lived Access Token you created earlier

### Step 4: Fix HTTPS Issue (Important!)

The default `mcp.json` assumes HTTPS, but the container uses HTTP:

1. In `mcp.json`, find the "inputs" section
2. Change the `homeassistant-domain` default value from `https://...` to just `homeassistant`
3. Click the **"Restart"** button for the MCP server in VS Code
4. Now it should connect successfully!

---

## 🧪 Part 3: Testing with GitHub Copilot

### Step 1: Verify MCP Tools Are Available

1. Open GitHub Copilot Chat panel in VS Code
2. Click the "tools" icon (or type `@workspace`) 
3. Verify that Copilot can see the new Home Assistant tools
4. You should see tools like:
   - `lights_control`
   - `climate_control` 
   - `automation`
   - `list_devices`
   - `notify`
   - `scene_control`

### Step 2: Test Basic Functionality

Try asking Copilot questions like:
- "What areas do I have in my house?" (`qué áreas tengo como parte de mi casa`)
- "List all devices"
- "Show me the lights"

Copilot will ask permission to use the Home Assistant tools - click **"Continue"** to allow.

### Step 3: Test Commands (if you have a real HA instance)

If you switch to a real Home Assistant instance, you can test:
- "Turn on the office lights" 
- "Set the temperature to 22 degrees"
- "Activate the movie scene"

---

## 🔧 Troubleshooting

### Connection Issues
- Ensure you're using `homeassistant` (not `localhost:8123`) as domain
- Verify the token is correct and hasn't expired
- Check that the MCP server restarted after configuration changes

### Tool Registration Issues  
- The PR #14 fixes should have resolved duplicate tool registration
- If you see errors about duplicate tools, ensure the fixes were applied correctly
- Check that duplicate files were removed from `src/tools/`

### Docker Issues
- Ensure Docker Desktop is running
- Try rebuilding the container if setup fails
- Check VS Code Dev Containers extension is up to date

---

## 📚 Additional Resources

- **Original Repository**: https://github.com/0GiS0/home-assistant-mcp
- **Home Assistant MCP Integration Docs**: https://www.home-assistant.io/integrations/mcp_server/
- **Video Tutorial**: https://youtu.be/6J4KD5NJtdc (Spanish)

---

## ✅ Success Criteria

You'll know everything is working when:
1. ✅ Home Assistant container is running on port 8123
2. ✅ You can access Home Assistant web interface  
3. ✅ MCP integration is installed in Home Assistant
4. ✅ VS Code connects to Home Assistant via MCP (no errors in restart)
5. ✅ GitHub Copilot can see and use Home Assistant tools
6. ✅ You can query Home Assistant data through Copilot chat

**Now you have a complete testing environment to safely test the MCP server before deploying to your real Home Assistant instance!**