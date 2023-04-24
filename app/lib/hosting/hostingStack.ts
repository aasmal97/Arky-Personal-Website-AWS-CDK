import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createCertificate } from "../../../utils/createResources/createCertificate";
import { createHostedZone } from "../../../utils/createResources/createHostedZone";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { mapS3AndCloudfront } from "../../../utils/mapResources/mapS3AndCloudfront";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
  createAliasRecord,
  createCnameRecord,
} from "../../../utils/createResources/createRecords";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { join } from "path";
export class HostingStack extends cdk.Stack {
  getClientBucket: () => cdk.aws_s3.Bucket;
  getClientCloudfrontDist: () => cdk.aws_cloudfront.Distribution;
  getImgBucket: () => cdk.aws_s3.Bucket;
  getImgCloudfrontDist: () => cdk.aws_cloudfront.Distribution;
  getHostedZone: () => IHostedZone;
  getClientAliasRecord: () => cdk.aws_route53.AaaaRecord;
  getImgAliasRecord: () => cdk.aws_route53.AaaaRecord;
  getWWWCnameRecord: () => cdk.aws_route53.CnameRecord;
  getCertificate: () => cdk.aws_certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const hostedZone = createHostedZone({
      stack: this,
      domainName: "arkyasmal.com",
      zoneName: "arkyasmalCom",
    });
    //add a cname record that maps www domain to main one
    const wwwCnameRecord = createCnameRecord({
      stack: this,
      recordName: "www.arkyasmal.com",
      domainName: "arkyasmal.com",
      zone: hostedZone,
      id: "wwwCnameRecord",
    });
    const domainNames = {
      "arkyasmal.com": hostedZone,
      "www.arkyasmal.com": hostedZone,
      "mediafiles.arkyasmal.com": hostedZone,
      "api.arkyasmal.com": hostedZone,
    };

    const certificate = createCertificate({
      stack: this,
      certName: "generalCertificate",
      primaryDomainName: "arkyasmal.com",
      domainValidations: domainNames,
    });
    const [imgBucket, imgDistrubition] = mapS3AndCloudfront({
      stack: this,
      bucketName: "arkyasmal-media-files-bucket",
      domainNames: ["mediafiles.arkyasmal.com"],
      certificate: certificate,
    });
    //add cloudfront function
    const clientCloudfrontRedirectBehaviorFunc = new cloudfront.Function(
      this,
      "clientCloudfrontRedirectBehaviorFunc",
      {
        functionName: "ClientCloudfrontRedirectBehaviorFunc",
        code: cloudfront.FunctionCode.fromFile({
          filePath: join(__dirname, "clientCloudfrontRedirectBehaviorFunc.js"),
        }),
        comment: "Client Cloudfront Redirect Behavior Function",
      }
    );
    const [clientBucket, clientDistrubition] = mapS3AndCloudfront({
      stack: this,
      bucketName: "arkyasmal-client-app-bucket",
      domainNames: ["arkyasmal.com", "www.arkyasmal.com"],
      certificate: certificate,
      isWebsite: {
        rootObjPath: "index.html",
        redirectFunc: clientCloudfrontRedirectBehaviorFunc,
      },
    });

    //add records from cloudfront created resources to hosted zone
    const clientDistTarget = new CloudFrontTarget(clientDistrubition);
    const imgDistTarget = new CloudFrontTarget(imgDistrubition);
    const clientAliasRecord = createAliasRecord({
      zone: hostedZone,
      aliasTarget: clientDistTarget,
      stack: this,
      id: "clientCloudfrontAliasRecord",
      recordName: "arkyasmal.com",
    });
    const imgAliasRecord = createAliasRecord({
      zone: hostedZone,
      aliasTarget: imgDistTarget,
      stack: this,
      id: "imgCloudfrontAliasRecord",
      recordName: "mediafiles.arkyasmal.com",
    });
    //assign resources to created methods
    this.getClientAliasRecord = () => clientAliasRecord;
    this.getImgAliasRecord = () => imgAliasRecord;
    this.getWWWCnameRecord = () => wwwCnameRecord;
    this.getHostedZone = () => hostedZone;
    this.getClientBucket = () => clientBucket;
    this.getClientCloudfrontDist = () => clientDistrubition;
    this.getImgBucket = () => imgBucket;
    this.getImgCloudfrontDist = () => imgDistrubition;
    this.getCertificate = () => certificate;
  }
}
