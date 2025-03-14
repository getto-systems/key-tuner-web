#!/bin/bash
set -e

if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "AWS_ACCESS_KEY_ID is not defined"
    exit 1
fi
if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "AWS_SECRET_ACCESS_KEY is not defined"
    exit 1
fi
if [ -n "$AWS_DEFAULT_REGION" ]; then
    echo "AWS_DEFAULT_REGION is not defined"
    exit 1
fi
if [ -n "$S3_BUCKET" ]; then
    echo "S3_BUCKET is not defined"
    exit 1
fi

VERSION=$(cat .release-version)

echo "Building version $VERSION"

npm ci
npm run build:wasm
npm run build

echo "Deploying version $VERSION to aws s3://$S3_BUCKET/$VERSION"

# Deploy to S3
aws s3 sync web/dist s3://$S3_BUCKET/$VERSION

echo "Deployment of version $VERSION completed successfully"
