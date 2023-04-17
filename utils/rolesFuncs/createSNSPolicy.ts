import { aws_iam } from "aws-cdk-lib"
const createSNSPolicy = () => {
    return aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSNSFullAccess")
}
export default createSNSPolicy