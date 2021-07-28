from aws_cdk import (
    core,
    aws_s3 as s3,
    aws_ec2 as ec2,
    aws_iam as iam,
)

class EC2IGVWebAppStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Get VPC details
        Ivpc = ec2.Vpc.from_lookup(self, "VPC", vpc_id=config_dict['VpcId'])

        # Get subnet selection context created
        subnet_ids_list = config_dict['SubnetIds'].split(",")
        availability_zone_list = config_dict['AvailabilityZones'].split(",")
        subnet_object_list = []
        count = 0
        for subnet_id in subnet_ids_list:
            subnet_object_list.append(ec2.Subnet.from_subnet_attributes(self, "subnet_%s" % count,
                                                                        subnet_id=subnet_id,
                                                                        availability_zone=availability_zone_list[count]
                                                                        ))
            count += 1
        
        # Creating user_data field content and replace the port if required.
        with open("cdk_templates/user_data.sh") as file:
            user_data = file.read()
            # Replace the port
            user_data = user_data.replace("replace_port", config_dict['AppPort'])

        file.close()
        
        # Create Security Group for EC2 Functions
        createEC2SecurityGroup = ec2.SecurityGroup(self, "createEC2SecurityGroup",
                                                        vpc=Ivpc,
                                                        allow_all_outbound=True,
                                                        description="This security group will be used for EC2 IGV WebApp",
                                                        security_group_name=config_dict['EC2IGVSecurityGroupName']
                                        )
        
        # Add VPN CIDR to access this security group for SSH and HTTPS
        createEC2SecurityGroup.add_ingress_rule(
            peer=ec2.Peer.ipv4(config_dict['VpnIPCIDR']),
            connection=ec2.Port.tcp(22)
        )

        createEC2SecurityGroup.add_ingress_rule(
            peer=ec2.Peer.ipv4(config_dict['VpnIPCIDR']),
            connection=ec2.Port.tcp(8080)
        )

        # Setting up Latest Amazon Linux AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
            )
        
        # Create EC2 Host
        ec2_host = ec2.Instance(self, "ec2_host",
                            instance_type=ec2.InstanceType(
                            instance_type_identifier=config_dict['EC2Type']),
                            instance_name=config_dict['InstanceName'],
                            machine_image=amzn_linux,
                            vpc=Ivpc,
                            key_name=config_dict['KeyName'],
                            vpc_subnets=ec2.SubnetSelection(subnets=subnet_object_list),
                            user_data=ec2.UserData.custom(user_data),
                            security_group=createEC2SecurityGroup
                            )

        # Display Commands
        core.CfnOutput(self, "createEC2SecurityGroupId",value=createEC2SecurityGroup.security_group_id)
        core.CfnOutput(self, "EC2 Private IP", value=ec2_host.instance_private_ip)
        message = "Give it 5 mins to spin up before you click the URL : http://%s:%s" % (ec2_host.instance_private_ip, config_dict['AppPort'])
        core.CfnOutput(self, id="Message", value=message)
