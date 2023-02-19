export const convertToStr = (str: string | undefined | null) => {
  if (typeof str === "string") return str;
  else return "";
};
