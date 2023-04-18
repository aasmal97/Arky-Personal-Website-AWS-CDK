import { aws_iam } from "aws-cdk-lib"

const createSESPolicy = () => {
    const policy = aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSESFullAccess")
    return policy
}
export default createSESPolicy