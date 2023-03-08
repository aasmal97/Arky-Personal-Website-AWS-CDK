import * as Jimp from "jimp";
export const resizeImg = async ({
  mimeType,
  fileBuffer,
  width
}: {
  mimeType?: string | null;
  fileBuffer?: Buffer | null;
  width: number
}) => {
  if (!fileBuffer || !mimeType) return null;
  const img = await Jimp.read(fileBuffer)
  const newImg = img
    .resize(width, Jimp.AUTO)
  const [buffer, base64] =await Promise.all([newImg.getBufferAsync(mimeType), newImg.getBase64Async(mimeType)]);
  return {
    buffer, 
    base64
  };
};
