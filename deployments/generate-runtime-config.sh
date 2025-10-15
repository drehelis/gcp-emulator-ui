#!/bin/sh

CONFIG_FILE="${CONFIG_FILE:-/usr/share/nginx/html/config.json}"

echo "Generating runtime configuration..."

# Start with empty JSON object
CONFIG_JSON="{}"

if [ ! -z "$PUBSUB_PRE_CONFIGURED_MSG_ATTR" ]; then
    echo "Processing PUBSUB_PRE_CONFIGURED_MSG_ATTR..."
    
    if echo "$PUBSUB_PRE_CONFIGURED_MSG_ATTR" | jq empty 2>/dev/null; then
        echo "  [✓] Valid JSON detected"
        
        CONFIG_JSON=$(echo "$CONFIG_JSON" | jq --argjson attr "$PUBSUB_PRE_CONFIGURED_MSG_ATTR" \
            '.pubsub.pubsubPreConfiguredMsgAttr = $attr')
        
        if [ $? -eq 0 ]; then
            echo "  [✓] Successfully added to configuration"
        else
            echo "  [✗] Failed to merge JSON configuration"
            CONFIG_JSON="{}"
        fi
    else
        echo "  [✗] Warning: PUBSUB_PRE_CONFIGURED_MSG_ATTR is not valid JSON, ignoring"
    fi
else
    echo "No PUBSUB_PRE_CONFIGURED_MSG_ATTR environment variable found"
fi

# Write the final configuration using jq for pretty formatting
echo "$CONFIG_JSON" | jq '.' > "$CONFIG_FILE"
