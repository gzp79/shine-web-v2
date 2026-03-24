# AWS Tools

Utility scripts for monitoring AWS resource usage.

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) installed and configured (`aws configure`)
- Node.js 18+

## bedrock-usage.mjs

Fetches AWS Bedrock API invocation history from CloudTrail and prints a usage summary broken down by user, model, and day. Fetches per-day chunks in parallel for speed.

### Usage

```bash
# Default: last 3 days, us-east-1, 6 parallel workers
node tools/aws/bedrock-usage.mjs

# Custom days
node tools/aws/bedrock-usage.mjs 7

# Custom days + concurrency
node tools/aws/bedrock-usage.mjs 14 8

# Custom days + concurrency + region
node tools/aws/bedrock-usage.mjs 14 8 eu-west-1

# All known Bedrock regions
node tools/aws/bedrock-usage.mjs 3 6 all

# Region via env var
BEDROCK_REGION=eu-west-1 node tools/aws/bedrock-usage.mjs
```

### Output

- **Per-user summary** - total calls and model breakdown for each IAM user/role, with `[service]` tags for non-human callers
- **Daily breakdown** - per-day call counts for human users only
