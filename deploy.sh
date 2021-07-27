#!/bin/bash
set -e -x

# Read Arguments
export EnvironVarLower=$1
echo "Running for the environment/config variable : ${EnvironVarLower} ."

## Initialise Variables
source configs/deploy_config.env ${EnvironVarLower}

# If AwsRegion is not added in config, use default as "us-east-1"
if [ -z "${VAR}" ]
then
    echo "The AwsRegion variable is not set or '' and hence using the default as us-east-1 ."
    export AwsRegion="us-east-1"
fi 

# Setting up region for aws cli
aws configure set region ${AwsRegion}

#Get Account ID
export AccountId=$(aws sts get-caller-identity --output text --query 'Account')
echo "The Account Id : ${AccountId} and AwsRegion : ${AwsRegion}"

# Create EC2 Functions
cdk deploy ec2-igv-webapp-stack --require-approval never

