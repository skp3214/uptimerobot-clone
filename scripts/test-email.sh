#!/bin/bash

# Test email sending
curl -X POST http://localhost:3000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1><p>This is a test from UptimeMonitor</p>"
  }'
