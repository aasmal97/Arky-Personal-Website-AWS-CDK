function handler(event: any) {
  var request = event.request;
  var uri = request.uri;
  if (!uri.includes(".")) {
    request.uri += "/index.html";
  }
  return request;
}
// export default handler
