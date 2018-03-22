// function loadScript( path, cb ) {
//   const head = document.getElementsByTagName('head')[0];
//   const script = document.createElement('script');
//   script.src = path;
//   script.type = 'text/javascript';
//   head.append(script);
//   script.onload = cb;
// }
//
// if(true) {
//   loadScript('dist/theme_fallback.js');
// }

var condition = true;
var data;
function loadDoc() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      data = this.responseText;
      window.themify = data;
    }
  };
  xhttp.open("GET", "dist/theme_fallback.js", true);
  xhttp.send();
}
if (condition) {
  loadDoc();
}