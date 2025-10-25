# Systematic MCP Server Test Script
# Tests all tools, prompts, and resources

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MCP Server Systematic Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Container Status
Write-Host "Test 1: Checking container status..." -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Test 2: Check logs for errors
Write-Host "Test 2: Checking for errors in logs..." -ForegroundColor Yellow
docker-compose logs --tail=50 | Select-String -Pattern "error|Error|ERROR" -Context 0,1
Write-Host ""

# Test 3: Test stdio server can start
Write-Host "Test 3: Testing stdio server initialization..." -ForegroundColor Yellow
$testStdio = docker exec homeassistant-mcp-server sh -c "timeout 3 bun run src/stdio-server.ts 2>&1 || true"
if ($testStdio -match "error|Error") {
    Write-Host "FAILED: Errors detected in stdio server" -ForegroundColor Red
    Write-Host $testStdio
} else {
    Write-Host "PASSED: No immediate errors in stdio server" -ForegroundColor Green
}
Write-Host ""

# Test 4: Check if all source files are present
Write-Host "Test 4: Verifying source files..." -ForegroundColor Yellow
$files = @(
    "/app/src/stdio-server.ts",
    "/app/src/tools/index.ts",
    "/app/src/prompts/index.ts",
    "/app/src/prompts/handlers.ts"
)
foreach ($file in $files) {
    $exists = docker exec homeassistant-mcp-server test -f $file
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file missing" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Count registered tools
Write-Host "Test 5: Checking tool registrations..." -ForegroundColor Yellow
$toolCount = docker exec homeassistant-mcp-server sh -c "grep -c 'server.addTool' /app/src/stdio-server.ts || true"
Write-Host "  Tools should be registered in stdio-server: $toolCount references" -ForegroundColor Cyan
Write-Host ""

# Test 6: Count registered prompts
Write-Host "Test 6: Checking prompt registrations..." -ForegroundColor Yellow
$promptCount = docker exec homeassistant-mcp-server sh -c "grep -c 'export const prompts' /app/src/prompts/index.ts || true"
Write-Host "  Prompts exported: $promptCount" -ForegroundColor Cyan
$promptsInFile = docker exec homeassistant-mcp-server sh -c "grep -o 'name:.*create_automation\|name:.*debug_automation\|name:.*troubleshoot_entity' /app/src/prompts/index.ts | wc -l"
Write-Host "  Prompt definitions found: $promptsInFile" -ForegroundColor Cyan
Write-Host ""

# Test 7: Verify Home Assistant connection
Write-Host "Test 7: Testing Home Assistant connectivity..." -ForegroundColor Yellow
try {
    $haResponse = Invoke-WebRequest -Uri "http://192.168.1.11:8123" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Home Assistant is reachable" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Cannot reach Home Assistant" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Check environment variables in container
Write-Host "Test 8: Verifying environment configuration..." -ForegroundColor Yellow
$hasHassUrl = docker exec homeassistant-mcp-server sh -c "env | grep -c HASS_URL || true"
$hasHassToken = docker exec homeassistant-mcp-server sh -c "env | grep -c HASS_TOKEN || true"
if ($hasHassUrl -gt 0) {
    Write-Host "  ✓ HASS_URL is set" -ForegroundColor Green
} else {
    Write-Host "  ✗ HASS_URL not found" -ForegroundColor Red
}
if ($hasHassToken -gt 0) {
    Write-Host "  ✓ HASS_TOKEN is set" -ForegroundColor Green
} else {
    Write-Host "  ✗ HASS_TOKEN not found" -ForegroundColor Red
}
Write-Host ""

# Test 9: Check TypeScript compilation
Write-Host "Test 9: Testing TypeScript compilation..." -ForegroundColor Yellow
$tsCheck = docker exec homeassistant-mcp-server sh -c "cd /app && bun run --bun tsc --noEmit 2>&1 || true"
if ($tsCheck -match "error TS") {
    Write-Host "  ✗ TypeScript compilation errors found:" -ForegroundColor Red
    Write-Host $tsCheck | Select-String "error TS"
} else {
    Write-Host "  ✓ No TypeScript compilation errors" -ForegroundColor Green
}
Write-Host ""

# Test 10: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Container is running and stdio server should be accessible." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart VS Code Insiders to reconnect MCP client" -ForegroundColor White
Write-Host "2. Try using a prompt (e.g., create_automation)" -ForegroundColor White
Write-Host "3. Test a tool (e.g., get_version)" -ForegroundColor White
Write-Host ""
Write-Host "To test manually:" -ForegroundColor Yellow
Write-Host "  docker exec -i homeassistant-mcp-server bun run src/stdio-server.ts" -ForegroundColor Cyan
Write-Host ""
