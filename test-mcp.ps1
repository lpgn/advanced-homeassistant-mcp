# Test MCP Server - List Devices
$request = '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_devices","arguments":{}}}'
Write-Host "Sending request to list devices..."
echo $request | docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts
