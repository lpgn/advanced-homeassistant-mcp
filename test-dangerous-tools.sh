#!/bin/bash
# Test script for dangerous operations tools
# Each test is harmless and easily reversible

echo "Testing Home Assistant MCP Dangerous Operations"
echo "================================================"
echo ""

# Test 1: File Operations - List directory
echo "Test 1: File Operations - List /config directory"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"file_operations","arguments":{"operation":"list","path":"/config","recursive":false}}}' | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts 2>/dev/null | grep -v "^{" | tail -1
echo ""

# Test 2: File Operations - Check if file exists
echo "Test 2: File Operations - Check if automations.yaml exists"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"file_operations","arguments":{"operation":"exists","path":"/config/automations.yaml"}}}' | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts 2>/dev/null | grep -v "^{" | tail -1
echo ""

# Test 3: YAML Editor - List available files
echo "Test 3: YAML Editor - List available YAML config files"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"yaml_editor","arguments":{"operation":"list"}}}' | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts 2>/dev/null | grep -v "^{" | tail -1
echo ""

# Test 4: Shell Command - Echo test (harmless)
echo "Test 4: Shell Command - Echo test"
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"shell_command","arguments":{"command":"echo MCP_TEST_SUCCESS"}}}' | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts 2>/dev/null | grep -v "^{" | tail -1
echo ""

# Test 5: System Management - Check config
echo "Test 5: System Management - Check Home Assistant configuration"
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"system_management","arguments":{"action":"check_config"}}}' | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts 2>/dev/null | grep -v "^{" | tail -1
echo ""

echo "================================================"
echo "All tests completed!"
