const schema = {
  "type": "object",
  "properties": {
    "condition": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "conditions": {
            "type": "array",
            "items": {
              "$ref": "#/properties/config/properties/condition/items"
            }
          }
        }
      }
    }
  }
};

// Check if there are unresolved refs
const hasUnresolvedRefs = JSON.stringify(schema).includes('$ref');
console.log('Has $ref:', hasUnresolvedRefs);
console.log(JSON.stringify(schema, null, 2));
