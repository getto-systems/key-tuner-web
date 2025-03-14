#!/bin/bash
set -e

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "AWS_ACCESS_KEY_ID is not defined"
    exit 1
fi
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "AWS_SECRET_ACCESS_KEY is not defined"
    exit 1
fi
if [ -z "$AWS_DEFAULT_REGION" ]; then
    echo "AWS_DEFAULT_REGION is not defined"
    exit 1
fi
if [ -z "$S3_BUCKET" ]; then
    echo "S3_BUCKET is not defined"
    exit 1
fi

VERSION=$(cat .release-version)

echo "Deploying web/public to aws s3://$S3_BUCKET/"

# Deploy to S3
aws s3 sync web/public/index.html s3://$S3_BUCKET/index.html
aws s3 sync web/public/security-policy.html s3://$S3_BUCKET/security-policy.html
aws s3 sync web/public/.well-known s3://$S3_BUCKET/.well-known

echo "Deployment of version $VERSION completed successfully"
