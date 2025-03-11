function handler(event) {
  function updateURL(){
    var request = event.request;
    var uri = request.uri;
    if (uri.endsWith("/")) {
      request.uri += "index.html";
      return request;
    }
    //find origin
    var regex = /https?:\/\/.+((.org)|(.com))/;
    var uri_path_arr = uri.split(regex);
    var uri_path = uri_path_arr[uri_path_arr.length - 1];
    var sections = uri_path.split("/");
    var lastSection = sections[sections.length - 1];
    if (!lastSection.includes(".")) {
      request.uri += "/index.html";
    }
    return request;
  };
  try {
    return updateURL();
  } catch (err) {
    return event.request;
  }
}
// export default handler
