#!/usr/bin/env python3

from aws_cdk import core
import os
from cdk_templates.ec2_igv_webapp_stack import EC2IGVWebAppStack

# Define your account id to make import vpc work
env_cn = core.Environment(account=os.environ.get("AccountId"), region=os.environ.get("AwsRegion"))

# Initialising environment variables and creating a dictionary to pass
required_confs = {
    'VpcId': {'input_config_name': "VpcId", "default": None},
    'SubnetIds': {'input_config_name': "SubnetIds", "default": None},
    'AvailabilityZones': {'input_config_name': "AvailabilityZones", "default": None},
    'EC2Type': {'input_config_name': "EC2Type", "default": "t2.large"},
    'InstanceName': {'input_config_name': "InstanceName", "default": "IGV-WebApp"},
    'KeyName': {'input_config_name': "KeyName", "default": None},
    'EC2IGVSecurityGroupName': {'input_config_name': "EC2IGVSecurityGroupName", "default": "ec2-igv-webapp-sg"},
    'VpnIPCIDR': {'input_config_name': "VpnIPCIDR", "default": "0.0.0.0/0"},
    'AppPort': {'input_config_name': "AppPort", "default": "8080"}
}

config_dict = {}
for key, value in required_confs.items():
    if os.environ.get(value['input_config_name']) in ["", None]:
        config_dict[key] = value['default']
    else:
        config_dict[key] = os.environ.get(value['input_config_name'])

# Mandatory parameters check
for mandatory_key in ['VpcId', 'SubnetIds', 'AvailabilityZones', 'KeyName']:
    if config_dict[mandatory_key] is None:
        raise Exception("The required mandatory key : %s is not provided. Kindly add it in the deploy_config.env and rerun the step." % mandatory_key)

# Start execution of deployment
app = core.App()
EC2IGVWebAppStack(app, "ec2-igv-webapp-stack", config_dict, env=env_cn)
app.synth()
