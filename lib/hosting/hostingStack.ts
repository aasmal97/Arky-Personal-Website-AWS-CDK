import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createCertificate } from "@utils/createResources/createCertificate";
import { createHostedZone } from "@utils/createResources/createHostedZone";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { mapS3AndCloudfront } from "@utils/mapResources/mapS3AndCloudfront";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
  createAliasRecord,
  createCnameRecord,
} from "@utils/createResources/createRecords";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { join } from "path";
import {
  CLIENT_CLOUDFRONT_REDIRECT_BEHAVIOR_FUNC_NAME,
  CLIENT_FILES_S3_BUCKET_NAME,
  CLOUDFRONT_CLIENT_ALIAS_RECORD_NAME,
  CLOUDFRONT_MEDIA_FILES_ALIAS_RECORD_NAME,
  GENERAL_CERTIFICATE_NAME,
  DOMAIN_NAME,
  HOSTED_ZONE_NAME,
  MEDIA_FILES_DOMAIN_NAME,
  MEDIA_FILES_S3_BUCKET_NAME,
  REST_API_DOMAIN_NAME,
  WWW_CNAME_RECORD_NAME,
  WWW_DOMAIN_NAME,
} from "@app/constants";
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
      domainName: DOMAIN_NAME,
      zoneName: HOSTED_ZONE_NAME,
    });
    //add a cname record that maps www domain to main one
    const wwwCnameRecord = createCnameRecord({
      stack: this,
      recordName: WWW_DOMAIN_NAME,
      domainName: DOMAIN_NAME,
      zone: hostedZone,
      id: WWW_CNAME_RECORD_NAME,
    });
    const domainNames = {
      DOMAIN_NAME: hostedZone,
      [WWW_DOMAIN_NAME]: hostedZone,
      [MEDIA_FILES_DOMAIN_NAME]: hostedZone,
      [REST_API_DOMAIN_NAME]: hostedZone,
    };

    const certificate = createCertificate({
      stack: this,
      certName: GENERAL_CERTIFICATE_NAME,
      primaryDomainName: DOMAIN_NAME,
      domainValidations: domainNames,
    });
    const [imgBucket, imgDistrubition] = mapS3AndCloudfront({
      stack: this,
      bucketName: MEDIA_FILES_S3_BUCKET_NAME,
      domainNames: [MEDIA_FILES_DOMAIN_NAME],
      certificate: certificate,
    });
    //add cloudfront function
    const clientCloudfrontRedirectBehaviorFunc = new cloudfront.Function(
      this,
      CLIENT_CLOUDFRONT_REDIRECT_BEHAVIOR_FUNC_NAME,
      {
        functionName: CLIENT_CLOUDFRONT_REDIRECT_BEHAVIOR_FUNC_NAME,
        code: cloudfront.FunctionCode.fromFile({
          filePath: join(__dirname, "clientCloudfrontRedirectBehaviorFunc.js"),
        }),
        comment: "Client Cloudfront Redirect Behavior Function",
      }
    );
    const [clientBucket, clientDistrubition] = mapS3AndCloudfront({
      stack: this,
      bucketName: CLIENT_FILES_S3_BUCKET_NAME,
      domainNames: [DOMAIN_NAME, WWW_DOMAIN_NAME],
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
      id: CLOUDFRONT_CLIENT_ALIAS_RECORD_NAME,
      recordName: DOMAIN_NAME,
    });
    const imgAliasRecord = createAliasRecord({
      zone: hostedZone,
      aliasTarget: imgDistTarget,
      stack: this,
      id: CLOUDFRONT_MEDIA_FILES_ALIAS_RECORD_NAME,
      recordName: MEDIA_FILES_DOMAIN_NAME,
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
