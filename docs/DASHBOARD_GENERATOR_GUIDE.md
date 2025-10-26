# 🎨 Advanced Dashboard Layout Generator Guide

The enhanced `dashboard_config` tool now includes intelligent layout generation based on device type, usage patterns, and prioritization strategies.

---

## 📱 Device Types

### Mobile
**Perfect for:** Smartphones, one-handed operation, on-the-go control

**Features:**
- Single-column layout for easy scrolling
- Large touch targets (tile cards) minimum 44x44px
- Essential controls only
- Quick access badges at top
- Vertical stacking for one-handed use
- Minimal visual complexity

**Best For:**
- Quick checks while away from home
- Essential controls (lights, locks, thermostat)
- Status monitoring
- Emergency access

---

### Desktop
**Perfect for:** Full computer screens, detailed monitoring, power users

**Features:**
- Multi-column grid layouts (3-4 columns)
- History graphs and statistics
- Detailed entity controls
- Multiple specialized views
- Advanced visualizations (gauges, charts)
- Energy monitoring

**Best For:**
- Detailed system monitoring
- Energy management
- Automation development
- Historical data analysis
- Multi-device control

---

### Tablet
**Perfect for:** Wall-mounted control panels, kitchen/bedroom tablets

**Features:**
- 2-3 column layout
- Touch-optimized controls
- Balance of detail and simplicity
- Landscape orientation optimized
- Scene quick-access buttons
- Mixed card types for engagement

**Best For:**
- Wall-mounted control panels
- Central family control point
- Kitchen/bedroom dashboards
- Guest access points

---

### Wall Panel
**Perfect for:** Always-on displays, kiosks, information panels

**Features:**
- At-a-glance information display
- Large text and icons (3-4em)
- Large gauge displays
- Auto-updating cards
- Minimal interaction required
- High contrast for visibility
- Clock and date display

**Best For:**
- Entryway displays
- Permanently mounted tablets
- Information-only displays
- Security monitoring
- Status boards

---

## 🎯 Priority Modes

### Most Used
**Analyzes usage patterns** to place frequently accessed entities at the top.

**How it works:**
1. Tracks entity interaction frequency
2. Calculates daily averages
3. Identifies top 5-10 most used
4. Places them in prominent positions
5. Creates "Favorites" view

**Example:**
```
⭐ Favorites (Most Used)
1. Light - Living Room (245 uses/week)
2. Climate - Bedroom (168 uses/week)
3. Switch - Coffee Maker (147 uses/week)
4. Light - Kitchen (134 uses/week)
5. Media Player - Living Room TV (98 uses/week)
```

**Best for:** 
- Busy households
- Optimizing daily routines
- Reducing navigation time

---

### By Area
**Groups entities by physical location** for logical home navigation.

**How it works:**
1. Identifies all areas/rooms
2. Groups entities by location
3. Creates views or sections per area
4. Includes area-specific automations

**Example Views:**
- 🏠 Living Room
- 🛏️ Bedroom
- 🍳 Kitchen
- 🚿 Bathroom
- 🏡 Outdoor

**Best for:**
- Multi-room homes
- Room-by-room control
- Logical navigation flow
- Family members managing specific areas

---

### By Type
**Organizes by device category** for bulk control and similar device management.

**How it works:**
1. Groups all lights together
2. Groups all climate devices
3. Groups all media players
4. Separate views per type

**Example Views:**
- 💡 All Lights
- 🌡️ All Climate Controls
- 📺 All Media Players
- 🔒 All Security Devices
- 🔌 All Switches & Plugs

**Best for:**
- Managing similar devices
- Bulk operations (all lights off)
- Power users
- Device-specific settings

---

### Custom
**You define the priority** with flexible arrangement and mixed groupings.

**How it works:**
1. Specify exact entity order
2. Define custom groupings
3. Mix priorities as needed
4. Create specialized views

**Example Custom Priorities:**
- Morning routine entities first
- Security devices prominent
- Energy monitoring central
- Guest-friendly controls

**Best for:**
- Specific workflows
- Unique home layouts
- Special requirements
- Advanced users

---

## 🚀 Usage Examples

### Example 1: Generate Mobile Dashboard (Most Used Priority)

```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "mobile",
    "priority": "most-used",
    "areas": ["living_room", "bedroom", "kitchen"]
  }
}
```

**Result:**
- Single column layout
- Favorites view with top 5 entities
- Tile cards for quick toggles
- Minimal badges at top
- Room-based second view

---

### Example 2: Generate Desktop Dashboard (By Area)

```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "desktop",
    "priority": "by-area",
    "areas": ["living_room", "bedroom", "kitchen", "office", "bathroom"]
  }
}
```

**Result:**
- 3-column grid layout
- Overview view with weather + stats
- Separate view per area
- History graphs in each view
- Energy monitoring view

---

### Example 3: Generate Wall Panel Dashboard

```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "wall-panel",
    "priority": "most-used"
  }
}
```

**Result:**
- Large gauge displays
- Prominent clock/date
- Door/lock status
- Temperature/humidity gauges
- Minimal interaction
- Auto-refresh enabled

---

### Example 4: Analyze Usage Patterns

```json
{
  "operation": "analyze_usage_patterns",
  "config": {
    "days": 7
  }
}
```

**Returns:**
- Top 5-10 most used entities
- Usage by time of day (morning/afternoon/evening/night)
- Usage by area with statistics
- Recommendations for dashboard optimization

---

### Example 5: Optimize Existing Layout for Device

```json
{
  "operation": "optimize_for_device",
  "config": {
    "device_type": "mobile",
    "existing_layout": {
      "title": "My Dashboard",
      "views": [...]
    }
  }
}
```

**Result:**
- Converts multi-column to single column
- Changes buttons to tiles
- Removes unnecessary complexity
- Optimizes for touch
- Returns modified YAML

---

## 📋 Quick Reference

### Available Operations

| Operation | Description | Use Case |
|-----------|-------------|----------|
| `list_card_types` | List all available card types | Reference when building custom cards |
| `create_view` | Create single dashboard view | Add new view to existing dashboard |
| `create_card` | Create single card config | Build custom cards |
| `generate_layout` | Basic 3-view dashboard | Quick starter dashboard |
| `generate_smart_layout` | **Intelligent device-optimized dashboard** | **Primary recommended method** |
| `analyze_usage_patterns` | Get usage statistics | Understand entity usage |
| `optimize_for_device` | Convert existing to device-optimized | Adapt existing dashboards |
| `get_recommendations` | Get AI optimization tips | Learn best practices |

---

## 🎨 Card Types Available

The generator supports 20+ card types including:

### Basic Cards
- `entities` - Multiple entities list
- `button` - Single entity button
- `tile` - Modern touch-friendly control
- `glance` - Compact multi-entity view

### Visualization Cards
- `gauge` - Circular gauge with severity colors
- `sensor` - Sensor with inline graph
- `history-graph` - Multi-entity historical data
- `statistics-graph` - Statistical visualizations

### Layout Cards
- `grid` - Responsive grid layout
- `horizontal-stack` - Side-by-side cards
- `vertical-stack` - Stacked cards
- `conditional` - Show based on conditions

### Specialized Cards
- `weather-forecast` - Weather display
- `thermostat` - Climate control
- `light` - Advanced light control
- `media-player` - Media control
- `alarm-panel` - Security system
- `energy-distribution` - Energy flow
- `picture-entity` - Entity with image
- `markdown` - Rich text display

### HACS Custom Cards (if installed)
- `mushroom` cards - Modern UI
- `mini-graph-card` - Compact graphs
- `button-card` - Advanced buttons
- `auto-entities` - Dynamic lists

---

## 💡 Best Practices

### Mobile Dashboards
1. ✅ Use tile cards for primary controls
2. ✅ Keep to 1 column maximum
3. ✅ Add badges for quick status
4. ✅ Limit to 5-7 cards per view
5. ❌ Avoid complex grids
6. ❌ Don't use history graphs (too small)

### Desktop Dashboards
1. ✅ Use 3-4 column grids
2. ✅ Add history graphs liberally
3. ✅ Create specialized views
4. ✅ Include statistics and gauges
5. ✅ Add energy monitoring
6. ❌ Don't overcrowd single view

### Tablet Dashboards
1. ✅ Optimize for landscape
2. ✅ Use 2-3 columns
3. ✅ Add scene quick buttons
4. ✅ Balance info and controls
5. ❌ Avoid tiny text
6. ❌ Don't require precise taps

### Wall Panel Dashboards
1. ✅ Large gauges (3-4em text)
2. ✅ High contrast colors
3. ✅ Auto-refresh every 30-60s
4. ✅ Prominent clock/date
5. ✅ Minimal interaction
6. ❌ Avoid small text (<2em)
7. ❌ Don't require toggles

---

## 🔄 Workflow

### Recommended Workflow

1. **Analyze Usage**
   ```json
   {"operation": "analyze_usage_patterns", "config": {"days": 14}}
   ```

2. **Generate Smart Layout**
   ```json
   {
     "operation": "generate_smart_layout",
     "config": {
       "device_type": "desktop",
       "priority": "most-used",
       "areas": ["living_room", "bedroom", "kitchen"]
     }
   }
   ```

3. **Review and Customize**
   - Check generated YAML
   - Modify entity IDs to match your setup
   - Adjust titles and icons

4. **Apply to Home Assistant**
   - Copy YAML configuration
   - Settings > Dashboards > Add Dashboard
   - Switch to YAML mode
   - Paste and save

5. **Optimize for Other Devices**
   ```json
   {
     "operation": "optimize_for_device",
     "config": {
       "device_type": "mobile",
       "existing_layout": {...}
     }
   }
   ```

---

## 📊 Sample Outputs

### Mobile Layout Structure
```yaml
title: Mobile Dashboard
views:
  - title: ⭐ Favorites
    path: home
    icon: mdi:star
    badges:
      - type: entity
        entity: person.owner
    cards:
      - type: tile
        entity: light.living_room
        vertical: true
      - type: tile
        entity: climate.bedroom
        vertical: true
```

### Desktop Layout Structure
```yaml
title: Desktop Dashboard
views:
  - title: Overview
    path: overview
    type: panel
    cards:
      - type: grid
        columns: 3
        cards:
          - type: weather-forecast
          - type: gauge
          - type: history-graph
```

### Wall Panel Layout Structure
```yaml
title: Wall Panel
views:
  - title: At a Glance
    path: glance
    type: panel
    cards:
      - type: grid
        columns: 2
        cards:
          - type: gauge
            entity: sensor.temperature
            min: 10
            max: 35
            needle: true
```

---

## 🎯 Tips & Tricks

1. **Start Simple**: Begin with `generate_smart_layout`, then customize
2. **Test on Target Device**: Always test on the actual device type
3. **Use Analysis**: Run `analyze_usage_patterns` first for data-driven decisions
4. **Iterate**: Generate, test, adjust, regenerate
5. **Save Multiple Versions**: Create device-specific dashboards
6. **Use Badges Wisely**: Great for status, but don't overuse
7. **Leverage Conditionals**: Show/hide cards based on conditions
8. **Group Logically**: Related entities should be together
9. **Consider Guests**: Make guest-friendly dashboards
10. **Document Custom**: Use markdown cards to explain custom setups

---

## 🆘 Troubleshooting

### Dashboard Doesn't Look Right on Mobile
→ Use `optimize_for_device` with device_type: "mobile"

### Too Much Information
→ Switch priority to "most-used" and reduce areas

### Hard to Read from Distance
→ Use device_type: "wall-panel" for larger elements

### Slow Loading
→ Reduce history_graph hours_to_show to 24 or less

### Entities Not Found
→ Replace placeholder entity IDs with your actual IDs

---

## 📚 Additional Resources

- [Home Assistant Lovelace Documentation](https://www.home-assistant.io/lovelace/)
- [Card Types Reference](https://www.home-assistant.io/lovelace/cards/)
- [HACS Custom Cards](https://hacs.xyz/)
- [Dashboard Best Practices](https://www.home-assistant.io/dashboards/)

---

*Generated with the Advanced Home Assistant MCP Server Dashboard Generator*
