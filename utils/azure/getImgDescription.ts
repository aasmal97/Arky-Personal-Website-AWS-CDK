import axios, { AxiosError } from "axios";
import { resizeImg } from "../general/resizeImg";
import { Blob } from "buffer";
export const getImgDescription = async ({
  buffer,
  vision,
  mimeType,
  imgWidth
}: {
  buffer: Buffer;
  imgWidth: number;
  mimeType?: string | null;
  vision: {
    apiEndpoint: string;
    apiKey: string;
  };
}) => {
  const newImg = await resizeImg({
    mimeType,
    fileBuffer: buffer,
    width: imgWidth,
  });
  const encodedImg = newImg?.buffer;
  if (!encodedImg) return "";
  try {
    const description = await axios({
      url: `${vision.apiEndpoint}/vision/v3.2/describe`,
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": vision.apiKey,
        "Content-Type": "application/octet-stream",
      },
      data: new Blob([encodedImg]),
    });
    return description.data?.description?.captions?.[0]?.text;
  } catch (err) {
    const axErr = err as AxiosError;
    const code = axErr.code ? parseInt(axErr.code) : 500;
    return {
      statusCode: code,
      message: "Computer vision request was invalid",
    };
  }
};
