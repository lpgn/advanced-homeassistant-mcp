# Home Assistant MCP Server Research Findings

## Executive Summary

Research conducted on **October 25, 2025** analyzing all major Home Assistant MCP server implementations to identify tools and features we can borrow.

### Repositories Analyzed

1. **voska/hass-mcp** (213⭐, Python, Docker-based)
   - Most popular Python implementation
   - Focus on token efficiency and guided conversations
   - 12 tools + 7 prompts + 5 resource endpoints

2. **tevonsb/homeassistant-mcp** (449⭐, TypeScript, most popular overall)
   - Comprehensive TypeScript implementation
   - Natural language integration capabilities
   - Security-focused with extensive testing

3. **allenporter/mcp-server-home-assistant** (61⭐, Python, ARCHIVED)
   - Custom component integration approach
   - Proxy-based architecture
   - Moving into Home Assistant Core

4. **jango-blockchained/advanced-homeassistant-mcp** (34⭐, TypeScript, OUR FORK)
   - 27 tools implemented
   - Speech-to-text capabilities
   - Bun-based for performance

---

## Current Implementation Status (Our 27 Tools)

### ✅ What We Already Have

#### Core Control (8 tools)
- ✅ `control` - Universal device control (lights, climate, switches, covers)
- ✅ `lights_control` - Advanced light control with RGB and brightness
- ✅ `climate_control` - HVAC and thermostat operations
- ✅ `list_devices` - Device discovery and listing
- ✅ `scene` - Scene activation and listing
- ✅ `notify` - Notification system
- ✅ `check_config` - Configuration validation
- ✅ `update_entity` - Entity attribute updates

#### Discovery & Context (3 tools) ⭐ NEW
- ✅ `get_live_context` - Real-time YAML-formatted entity states
- ✅ `search_entities` - Natural language fuzzy search
- ✅ `get_system_prompt` - Context-aware system prompts

#### Automation (3 tools)
- ✅ `automation` - List, toggle, trigger automations
- ✅ `automation_config` - Advanced automation configuration (create, update, delete, duplicate)
- ✅ `reload_automations` - Reload automation configuration

#### History & Events (3 tools)
- ✅ `get_history` - Historical state data retrieval
- ✅ `subscribe_events` - SSE event streaming
- ✅ `get_sse_stats` - SSE connection statistics

#### System Management (3 tools)
- ✅ `addon` - Add-on management (list, install, start, stop, restart)
- ✅ `package` - HACS package management
- ✅ `file_operations` - File system operations (limited by API)

#### Advanced Features (4 tools)
- ✅ `service_call` - Execute any Home Assistant service
- ✅ `error_log` - Error log retrieval (REST API endpoint)
- ✅ `script_control` - Script search and management
- ✅ `update_system` - System updates

---

## 🆕 Tools We Should Implement (From voska/hass-mcp)

### HIGH PRIORITY - Core Tools We're Missing

**Status (Oct 2025):** All five high-priority tools are now implemented, registered with the MCP server, and covered by automated tests.

#### ✅ 1. **get_version** Tool 🔥
**What it does**: Returns Home Assistant version information
**Why we need it**: Basic system information, useful for debugging and compatibility checks
**Implementation**: Simple REST API call to `/api/config`

```typescript
{
  name: 'get_version',
  description: 'Get the Home Assistant version and system information',
  parameters: z.object({}),
  execute: async () => {
    const response = await fetch(`${HASS_HOST}/api/config`);
    const config = await response.json();
    return {
      version: config.version,
      unit_system: config.unit_system,
      time_zone: config.time_zone,
      location_name: config.location_name
    };
  }
}
```

#### ✅ 2. **get_entity** Tool with Field Filtering 🔥
**What it does**: Get specific entity state with optional field filtering
**Why we need it**: Token-efficient way to get only needed fields
**Enhancement to existing**: Add `fields` and `detailed` parameters to our entity queries

```typescript
{
  name: 'get_entity',
  description: 'Get entity state with optional field filtering',
  parameters: z.object({
    entity_id: z.string(),
    fields: z.array(z.string()).optional(),
    detailed: z.boolean().optional()
  }),
  execute: async (params) => {
    const response = await fetch(`${HASS_HOST}/api/states/${params.entity_id}`);
    const entity = await response.json();
    
    if (params.fields) {
      // Return only requested fields
      return pick(entity, params.fields);
    }
    
    if (!params.detailed) {
      // Minimal response: id, state, friendly_name only
      return {
        entity_id: entity.entity_id,
        state: entity.state,
        friendly_name: entity.attributes.friendly_name
      };
    }
    
    return entity; // Full response
  }
}
```

#### ✅ 3. **domain_summary** Tool 🔥
**What it does**: Get comprehensive summary of all entities in a domain
**Why we need it**: Quick overview of device types (e.g., "show me all my lights")
**Use case**: "Tell me about my climate devices", "What sensors do I have?"

```typescript
{
  name: 'domain_summary',
  description: 'Get a summary of all entities in a specific domain',
  parameters: z.object({
    domain: z.string(),
    example_limit: z.number().default(3)
  }),
  execute: async (params) => {
    const entities = await getAllEntitiesForDomain(params.domain);
    return {
      domain: params.domain,
      total_count: entities.length,
      states: groupBy(entities, 'state'),
      examples: entities.slice(0, params.example_limit),
      common_attributes: extractCommonAttributes(entities)
    };
  }
}
```

#### ✅ 4. **system_overview** Tool 🔥
**What it does**: Get comprehensive overview of entire Home Assistant system
**Why we need it**: One-stop system status check
**Returns**: Domain counts, system info, integration status

```typescript
{
  name: 'system_overview',
  description: 'Get comprehensive overview of entire Home Assistant system',
  parameters: z.object({}),
  execute: async () => {
    const [states, config, services] = await Promise.all([
      fetch(`${HASS_HOST}/api/states`).then(r => r.json()),
      fetch(`${HASS_HOST}/api/config`).then(r => r.json()),
      fetch(`${HASS_HOST}/api/services`).then(r => r.json())
    ]);
    
    return {
      version: config.version,
      entity_count: states.length,
      domains: groupAndCountByDomain(states),
      service_domains: Object.keys(services),
      location: config.location_name,
      time_zone: config.time_zone
    };
  }
}
```

#### ✅ 5. **restart_ha** Tool ⚠️
**What it does**: Restart Home Assistant
**Why we need it**: System maintenance and configuration reload
**Security**: Requires confirmation parameter to prevent accidental restarts

```typescript
{
  name: 'restart_ha',
  description: 'Restart Home Assistant (requires confirmation)',
  parameters: z.object({
    confirm: z.boolean().describe('Must be true to confirm restart')
  }),
  execute: async (params) => {
    if (!params.confirm) {
      return { success: false, message: 'Restart requires confirmation: set confirm=true' };
    }
    
    const response = await fetch(`${HASS_HOST}/api/services/homeassistant/restart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${HASS_TOKEN}` }
    });
    
    return {
      success: response.ok,
      message: 'Home Assistant is restarting...'
    };
  }
}
```

---

### MEDIUM PRIORITY - Enhanced Search & Discovery

#### 6. **Enhanced Entity Search** (Upgrade existing)
**What to add**: Scoring system similar to voska's implementation
**Current**: We have fuzzy search with word-based scoring
**Enhancement**: Add relevance scoring, sort by score, return score in results

```typescript
// Enhance our existing search_entities tool with scoring
interface SearchResult {
  entity_id: string;
  friendly_name: string;
  domain: string;
  state: string;
  score: number; // ADD THIS
}

// Scoring algorithm from voska:
// - Exact match: 100 points
// - All words present: 50 points  
// - Per word: 10-15 points based on position
// - Domain match: 5 points
```

#### 7. **list_entities Enhancement** (Upgrade existing)
**What to add**: Pagination and better filtering
**Current**: Basic listing with domain filter
**Enhancement**: Add limit, offset, state filtering, attribute filtering

```typescript
parameters: z.object({
  domain: z.string().optional(),
  search_query: z.string().optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
  state: z.string().optional(),
  attributes: z.record(z.any()).optional()
})
```

---

### LOW PRIORITY - Guided Conversations (MCP Prompts)

voska/hass-mcp has 7 prompts for guided conversations. We should implement:

#### 8. **create_automation** Prompt
**What it does**: Interactive guide for creating automations
**Use case**: "Help me create a new automation"
**Returns**: Guided conversation with system messages and examples

#### 9. **debug_automation** Prompt
**What it does**: Troubleshoot non-working automations
**Use case**: "My automation isn't working"
**Checks**: Triggers, conditions, actions, entity availability

#### 10. **troubleshoot_entity** Prompt
**What it does**: Diagnose entity issues
**Use case**: "My sensor is unavailable"
**Checks**: Integration status, device connectivity, recent changes

#### 11. **routine_optimizer** Prompt
**What it does**: Analyze usage patterns and suggest routines
**Use case**: "Optimize my automations based on usage"
**Analysis**: Historical data, usage patterns, energy optimization

#### 12. **automation_health_check** Prompt
**What it does**: Review all automations for issues
**Use case**: "Check my automations for problems"
**Finds**: Conflicts, redundancies, inefficiencies, race conditions

#### 13. **entity_naming_consistency** Prompt
**What it does**: Audit and standardize entity names
**Use case**: "Make my entity names consistent"
**Suggests**: Naming conventions, bulk rename operations

#### 14. **dashboard_layout_generator** Prompt
**What it does**: Generate optimized dashboard layouts
**Use case**: "Design a better dashboard for me"
**Analysis**: Usage frequency, groupings, mobile/desktop layouts

---

## 🎯 Resource Endpoints (From voska/hass-mcp)

voska implements 5 resource endpoints using the MCP resource protocol:

```python
# Resource endpoints provide read-only data access
@mcp.resource("hass://entities/{entity_id}")
@mcp.resource("hass://entities/{entity_id}/detailed")
@mcp.resource("hass://entities")
@mcp.resource("hass://entities/domain/{domain}")
@mcp.resource("hass://search/{query}/{limit}")
```

**What are Resources?**: MCP resources are read-only data endpoints that clients can query
**Why useful**: Lightweight way to expose data without creating full tools
**Should we implement?**: MAYBE - depends on client support for resources

---

## 📊 Comparison Matrix

| Feature | Our Implementation | voska/hass-mcp | tevonsb/homeassistant-mcp |
|---------|-------------------|----------------|--------------------------|
| **Total Tools** | 27 | 12 | ~20 |
| **Language** | TypeScript + Bun | Python | TypeScript + Node |
| **Architecture** | Standalone server | Docker container | Standalone server |
| **Version Info** | ❌ Need | ✅ | ✅ |
| **Field Filtering** | ❌ Need | ✅ | ❌ |
| **Domain Summary** | ❌ Need | ✅ | ❌ |
| **System Overview** | ❌ Need | ✅ | Partial |
| **Entity Search** | ✅ Good | ✅ Great (scoring) | ✅ Good |
| **Live Context** | ✅ NEW | ❌ | ❌ |
| **System Prompts** | ✅ NEW | ❌ | ❌ |
| **History** | ✅ | ✅ | ✅ |
| **Error Logs** | ✅ Fixed | ✅ | ✅ |
| **Automation Control** | ✅ Advanced | ✅ Basic | ✅ Advanced |
| **SSE Events** | ✅ | ❌ | ✅ |
| **Add-on Management** | ✅ | ❌ | ❌ |
| **HACS Packages** | ✅ | ❌ | ❌ |
| **Guided Prompts** | ❌ Need | ✅ 7 prompts | ❌ |
| **Resource Endpoints** | ❌ | ✅ 5 endpoints | ❌ |
| **Natural Language** | Partial | ❌ | ✅ Strong |
| **Speech-to-Text** | ✅ Whisper | ❌ | ❌ |
| **Docker Support** | ✅ | ✅ Excellent | ✅ |
| **Security Features** | ✅ Comprehensive | Basic | ✅ Strong |
| **Testing Coverage** | 85% | Good | 95% |

---

## 💡 Unique Features We Have That Others Don't

### 1. **Live Context Tool** ⭐
- Real-time YAML-formatted state snapshots
- Domain grouping
- Timestamp information
- NO OTHER IMPLEMENTATION HAS THIS

### 2. **System Prompts Tool** ⭐
- AI-ready context generation
- Tool usage guidelines
- Entity inventory by domain
- NO OTHER IMPLEMENTATION HAS THIS

### 3. **Advanced Automation Configuration** ⭐
- Create, update, delete, duplicate automations
- Full configuration object support
- Mode selection (single, parallel, queued, restart)
- MOST COMPREHENSIVE AUTOMATION CONTROL

### 4. **Add-on Management** ⭐
- List, install, uninstall add-ons
- Start, stop, restart
- Version management
- UNIQUE TO OUR IMPLEMENTATION

### 5. **HACS Package Management** ⭐
- Integration, plugin, theme management
- Version control
- Repository management
- UNIQUE TO OUR IMPLEMENTATION

### 6. **Speech-to-Text Integration** ⭐
- Whisper model support
- Wake word detection
- Voice command processing
- UNIQUE TO OUR IMPLEMENTATION

### 7. **SSE Event Streaming** ⭐
- Real-time event subscriptions
- Multiple client support
- Domain and entity filtering
- Connection statistics
- MORE ADVANCED THAN OTHERS

### 8. **Bun Runtime** ⭐
- 4x faster than Node.js
- Built-in TypeScript support
- Better memory efficiency
- UNIQUE RUNTIME CHOICE

---

## 🎯 Implementation Priority

### Phase 1: Core Tools (2-3 hours) 🔥
1. ✅ `get_version` - Simple version info
2. ✅ `get_entity` with field filtering - Enhance existing
3. ✅ `domain_summary` - New comprehensive tool
4. ✅ `system_overview` - System-wide status
5. ✅ `restart_ha` - With safety confirmation

### Phase 2: Search Enhancements (1-2 hours)
6. ✅ Enhanced `search_entities` with scoring
7. ✅ Enhanced `list_entities` with pagination

### Phase 3: Guided Prompts (2-3 hours)
8. ✅ 7 prompt implementations for guided conversations
9. ✅ MCP prompt protocol support

### Phase 4: Resources (Optional, 1-2 hours)
10. ⚠️ MCP resource endpoints (if client support exists)

---

## 📝 Implementation Notes

### Technical Considerations

1. **Field Filtering**: Implement as middleware to reduce token usage
2. **Scoring System**: Use similar algorithm to voska (exact: 100, all words: 50, per word: 10-15)
3. **Prompts**: Use MCP `@server.list_prompts()` and `@server.get_prompt()` decorators
4. **Resources**: Check if Claude Desktop and other clients support MCP resources
5. **Safety**: Add confirmation parameters for destructive operations (restart, delete)

### Code Organization

```text
src/tools/
├── version.tool.ts          # NEW: get_version
├── entity-query.tool.ts     # ENHANCE: field filtering
├── domain-summary.tool.ts   # NEW: domain_summary
├── system-overview.tool.ts  # NEW: system_overview
├── restart.tool.ts          # NEW: restart_ha
└── entity-search.tool.ts    # ENHANCE: scoring system

src/prompts/                 # NEW DIRECTORY
├── create-automation.ts     # Automation creation guide
├── debug-automation.ts      # Troubleshooting guide
├── troubleshoot-entity.ts   # Entity diagnostics
├── routine-optimizer.ts     # Usage pattern analysis
├── health-check.ts          # Automation review
├── naming-consistency.ts    # Entity naming audit
└── dashboard-generator.ts   # Dashboard layout creation

src/resources/               # NEW DIRECTORY (Optional)
└── entity-resources.ts      # Resource endpoint handlers
```

### Testing Strategy

1. Unit tests for each new tool
2. Integration tests with actual Home Assistant instance
3. Token usage benchmarks (before/after field filtering)
4. Prompt conversation flow testing
5. Error handling for edge cases

---

## 🚀 Expected Benefits After Implementation

### For Users
- ✅ **More discovery tools**: Version, domain summary, system overview
- ✅ **Better token efficiency**: Field filtering reduces response sizes
- ✅ **Guided assistance**: 7 prompts for common tasks
- ✅ **Comprehensive search**: Enhanced scoring and relevance
- ✅ **System maintenance**: Safe restart capabilities

### For Developers
- ✅ **Code reusability**: Prompt templates for common patterns
- ✅ **Better organization**: Separate directories for tools/prompts/resources
- ✅ **Enhanced testing**: More comprehensive test coverage
- ✅ **Documentation**: Auto-generated tool docs from schemas

### Competitive Position
- ✅ **30+ tools** (vs. 12-20 in other implementations)
- ✅ **Unique features** maintained (speech, add-ons, HACS, live context)
- ✅ **Best of both worlds**: voska's token efficiency + our advanced features
- ✅ **Most comprehensive** HA MCP server available

---

## 📊 Final Tool Count After Implementation

| Category | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|----------|---------|---------------|---------------|---------------|
| Core Control | 8 | 8 | 8 | 8 |
| Discovery & Context | 3 | 6 | 8 | 8 |
| Automation | 3 | 3 | 3 | 3 |
| History & Events | 3 | 3 | 3 | 3 |
| System Management | 3 | 4 | 4 | 4 |
| Advanced Features | 4 | 4 | 4 | 4 |
| Prompts | 0 | 0 | 0 | 7 |
| Resources | 0 | 0 | 0 | 5 (optional) |
| **TOTAL** | **27** | **30** | **32** | **39+** |

---

## 🎯 Recommendation

**IMPLEMENT PHASE 1 IMMEDIATELY** 🔥

The 5 core tools from Phase 1 are:
1. Essential for feature parity
2. Quick to implement (2-3 hours total)
3. High user value
4. No breaking changes

Phase 2 and 3 can follow based on user demand.

---

## 📚 References

- voska/hass-mcp: https://github.com/voska/hass-mcp
- tevonsb/homeassistant-mcp: https://github.com/tevonsb/homeassistant-mcp
- allenporter/mcp-server-home-assistant: https://github.com/allenporter/mcp-server-home-assistant
- Model Context Protocol: https://modelcontextprotocol.io/
- Home Assistant API: https://developers.home-assistant.io/docs/api/rest/

---

**Research completed**: October 25, 2025
**Next steps**: Implement Phase 1 tools (5 tools, ~2-3 hours)
