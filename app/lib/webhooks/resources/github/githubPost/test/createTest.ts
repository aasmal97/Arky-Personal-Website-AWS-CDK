import { createRepo } from "../repoActions";
import * as dotenv from "dotenv";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import { createData } from "./testData";
dotenv.config();
createRepo({
  data: createData.repository,
  apiKey: convertToStr(process.env.AMAZON_REST_API_KEY),
  restApiDomainName: convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME),
})
  .then((e) => console.log(e))
  .catch((err) => console.log(err));
