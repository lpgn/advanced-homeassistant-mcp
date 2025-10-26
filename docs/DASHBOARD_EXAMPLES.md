# 🎨 Dashboard Generator Quick Examples

## Example 1: Mobile Dashboard for Daily Use

### Generate Command
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

### What You Get
✅ Single-column layout  
✅ Large tile cards for easy tapping  
✅ Favorites view with most-used entities  
✅ Room-based organization  
✅ Quick status badges at top  

### Perfect For
- Quick control while away from home
- One-handed operation
- Essential controls only
- Family members' phones

---

## Example 2: Desktop Power User Dashboard

### Generate Command
```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "desktop",
    "priority": "by-type",
    "areas": ["living_room", "bedroom", "kitchen", "office", "bathroom"]
  }
}
```

### What You Get
✅ 3-4 column grid layouts  
✅ Separate views for Lights, Climate, Energy  
✅ History graphs (24+ hours)  
✅ System monitoring gauges  
✅ Statistics cards  
✅ Energy distribution visualization  

### Perfect For
- Detailed monitoring
- Automation development
- Energy management
- Multi-device control

---

## Example 3: Kitchen Wall-Mounted Tablet

### Generate Command
```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "tablet",
    "priority": "by-area",
    "areas": ["kitchen", "dining_room", "living_room"]
  }
}
```

### What You Get
✅ 2-3 column layout (landscape)  
✅ Touch-optimized controls  
✅ Scene quick-access buttons  
✅ Weather forecast  
✅ Nearby room controls  

### Perfect For
- Central family control point
- Kitchen/dining area management
- Guest access
- Morning routine hub

---

## Example 4: Entryway Wall Panel (Always-On Display)

### Generate Command
```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "wall-panel",
    "priority": "most-used"
  }
}
```

### What You Get
✅ Large clock and date display  
✅ Temperature/humidity gauges (readable from distance)  
✅ Door/lock status indicators  
✅ Weather forecast  
✅ Person detection status  
✅ Auto-refresh every 60 seconds  

### Perfect For
- Entryway displays
- Security monitoring
- At-a-glance status
- Information-only panels

---

## Example 5: Analyze Your Usage First

### Step 1: Analyze Patterns
```json
{
  "operation": "analyze_usage_patterns",
  "config": {
    "days": 14
  }
}
```

### Step 2: Use Results to Generate
Based on analysis showing living room light is most used:

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

### What You Learn
- Which entities you use most
- Usage patterns by time of day
- Which areas get most interaction
- Optimization recommendations

---

## Example 6: Convert Existing Dashboard for Mobile

### You Have a Desktop Dashboard
It works great on computer but terrible on phone.

### Convert It
```json
{
  "operation": "optimize_for_device",
  "config": {
    "device_type": "mobile",
    "existing_layout": {
      "title": "My Dashboard",
      "views": [
        {
          "title": "Home",
          "cards": [
            {"type": "grid", "columns": 4, "cards": [...]}
          ]
        }
      ]
    }
  }
}
```

### What Happens
✅ Grid columns reduced to 1  
✅ Button cards → Tile cards  
✅ Removed history graphs (too small)  
✅ Simplified entity cards  
✅ Larger touch targets  

---

## Example 7: Morning Routine Dashboard

### Custom Priority Dashboard
```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "tablet",
    "priority": "custom",
    "custom_priority": [
      "switch.coffee_maker",
      "light.kitchen",
      "climate.bedroom",
      "media_player.kitchen_speaker",
      "cover.bedroom_blinds"
    ]
  }
}
```

### Perfect Morning Flow
1. ☕ Coffee maker (top position)
2. 💡 Kitchen light
3. 🌡️ Bedroom climate
4. 🎵 Kitchen speaker for news
5. 🪟 Bedroom blinds

---

## Example 8: Security Dashboard

### Generate Security-Focused Layout
```json
{
  "operation": "generate_smart_layout",
  "config": {
    "device_type": "tablet",
    "priority": "custom",
    "areas": ["entry", "perimeter", "cameras"],
    "custom_priority": [
      "alarm_control_panel.home",
      "lock.front_door",
      "lock.back_door",
      "binary_sensor.motion_front",
      "camera.front_door"
    ]
  }
}
```

### Security Features
✅ Alarm panel prominently placed  
✅ All locks in one view  
✅ Motion sensors  
✅ Camera feeds  
✅ Door/window sensors  

---

## Tips for Each Device Type

### 📱 Mobile Tips
- Keep views under 7 cards each
- Use badges for quick status
- Tile cards over buttons
- One column only
- Favorites view first

### 💻 Desktop Tips
- Use all available screen space
- 3-4 column grids
- Add history graphs everywhere
- Separate specialized views
- Include system monitoring

### 📲 Tablet Tips
- Optimize for landscape
- 2-3 columns
- Add scene buttons
- Touch-friendly spacing
- Balance info & controls

### 🖥️ Wall Panel Tips
- Large text (3-4em)
- High contrast colors
- Minimal interaction
- Auto-refresh enabled
- At-a-glance info only

---

## Common Workflows

### Workflow 1: New User Starting Fresh
1. Run `analyze_usage_patterns` (days: 7)
2. Generate `desktop` layout with `most-used` priority
3. Test and identify missing entities
4. Generate `mobile` version
5. Sync and test on phone

### Workflow 2: Existing User Optimizing
1. Export current dashboard YAML
2. Run `optimize_for_device` for each device
3. Compare before/after
4. Apply best version
5. Iterate based on feedback

### Workflow 3: Multi-Device Household
1. Analyze usage for 14 days
2. Generate `desktop` for main computer
3. Generate `mobile` for family phones
4. Generate `tablet` for kitchen
5. Generate `wall-panel` for entry
6. Each device has optimized layout

---

## Next Steps

1. **Restart VS Code Insiders** to load new MCP tools
2. **Try Example 1** to see mobile layout
3. **Analyze your usage** with Example 5
4. **Generate for your device** type
5. **Customize** entity IDs to match your setup
6. **Apply** to Home Assistant
7. **Share** your results!

---

*Ready to create the perfect dashboard for every device in your home!* 🎉
