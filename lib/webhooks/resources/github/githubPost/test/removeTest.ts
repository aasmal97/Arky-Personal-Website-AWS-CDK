import { deleteRepo } from "../repoActions";
import * as dotenv from "dotenv";
import { convertToStr } from "@utils/general/convertToStr";
import { deleteData } from "./testData";
dotenv.config();
deleteRepo({
  data: deleteData,
  apiKey: convertToStr(process.env.AMAZON_REST_API_KEY),
  restApiDomainName: convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME),
})
  .then((e) => console.log(e))
  .catch((err) => console.log(err));
