$("#curr_lang").val("en");

$('#ch_lang').on('click', function (e) {
 changeLang("ch");
 $("#curr_lang").val("ch");
});
$('#en_lang').on('click', function (e) {
  changeLang("en");
   $("#curr_lang").val("en");
});

$('.collapse').on('show.bs.collapse', function () { 
  var currentLang = $("#curr_lang").val();
  changeLang(currentLang);
}); 
$('#upload').on('shown.bs.modal', function () { 
  var currentLang = $("#curr_lang").val();
   changeLang(currentLang);
}); 

function changeLang(lang){
  var currentLang = lang;
  var opts = { language: currentLang, pathPrefix: "./lang" };
  $("[data-localize]").localize("application", opts);
}

