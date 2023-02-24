import { Stack } from "aws-cdk-lib";
import { Rule, Schedule, IRuleTarget } from "aws-cdk-lib/aws-events";
import {
  CreateApiCallTaskTargetProps,
  createApiCallTaskTarget,
} from "./createApiCallTaskTarget";
export type CreateCronEventProps = {
  stack: Stack;
  targets: IRuleTarget[];
  id: string;
  hours: number;
};
export const createCronEvent = ({
  stack,
  targets,
  id,
  hours,
}: CreateCronEventProps) => {
  const rule = new Rule(stack, id, {
    schedule: Schedule.cron({
      hour: hours.toString(),
      minute: "0",
    }),
    targets: targets,
  });
  return rule;
};
export const createApiGatewayCronJob = ({
  stack,
  id,
  hours,
  restApi,
  path,
  headerParams
}: Omit<CreateCronEventProps, "targets"> & CreateApiCallTaskTargetProps) => {
  const target = createApiCallTaskTarget({
    restApi,
    path,
    headerParams
  });
  const event = createCronEvent({
    stack,
    id,
    hours,
    targets: [target],
  });
  return event;
};
