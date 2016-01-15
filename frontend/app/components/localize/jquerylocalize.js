function changeLang(lang){
  var currentLang = lang;
  var opts = { language: currentLang, pathPrefix: "./lang" };
  $("[data-localize]").localize("application", opts);
  $("body").addClass(currentLang);
  reinitTooltip(mq);
}

if (matchMedia) {
	var mq = window.matchMedia("(min-width: 768px)");
}


function reinitTooltip(mq) {
  $('[data-toggle="tooltip"]').tooltip('destroy');
	if (mq.matches) {
		// window width is at least 768px
		$('[data-toggle="tooltip"]').tooltip({
  		 trigger: "hover",
  		 delay: { "show": 1000, "hide": 100 }
		});
	}
	else {
		// window width is less than 768px
		$('[data-toggle="tooltip"]').tooltip({
  		trigger: "click"
		});
	}

}



$("#curr_lang").val("en");

$('#ch_lang').on('click', function (e) {
 changeLang("ch");
 $("#curr_lang").val("ch");
});
$('#en_lang').on('click', function (e) {
  changeLang("en");
   $("#curr_lang").val("en");
});


$('.collapse').each(function () {
   var collapse = $(this);
   collapse.on('shown.bs.collapse', function () { 
   var currentLang = $("#curr_lang").val();
   changeLang(currentLang);
  }); 
});

$('.modal').each(function () {
      var modal = $(this);
      modal.on('shown.bs.modal', function (e) {
      var currentLang = $("#curr_lang").val();
      changeLang(currentLang);
    });
});



