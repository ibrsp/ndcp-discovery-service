$(document).ready(function(){
    var discoReturnUrl = "https://federation.scienceforum.sc/Saml2/disco";

    function getIdPsFromStorage() {
        if (!localStorageAvailable) {
            return null;
        }

        var idps = JSON.parse(localStorage.getItem("idps"));
        if (idps === null) {
            idps = [];
        }

        return idps;
    }

    function loadShibEDS() {
        // Options for spinner while the JSON metadata loads.
        var opts = {
            lines: 13 // The number of lines to draw
          , length: 24 // The length of each line
          , width: 12 // The line thickness
          , radius: 28 // The radius of the inner circle
          , scale: 1 // Scales overall size of the spinner
          , corners: 1 // Corner roundness (0..1)
          , color: '#000' // #rgb or #rrggbb or array of colors
          , opacity: 0.25 // Opacity of the lines
          , rotate: 0 // The rotation offset
          , direction: 1 // 1: clockwise, -1: counterclockwise
          , speed: 1 // Rounds per second
          , trail: 60 // Afterglow percentage
          , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
          , zIndex: 2e9 // The z-index (defaults to 2000000000)
          , className: 'spinner' // The CSS class to assign to the spinner
          , top: '50%' // Top position relative to parent
          , left: '50%' // Left position relative to parent
          , shadow: false // Whether to render a shadow
          , hwaccel: false // Whether to use hardware acceleration
          , position: 'absolute' // Element positioning
        };

        // Start the spinner.
        var target = document.getElementById('idpSelect-container');
        var spinner = new Spinner(opts).spin(target);

        // Download the EDS scripts.
        $.getScript("js/typeahead.js");
        $.getScript("js/json2.js");
        $.getScript("js/idpselect_languages.js");

        // Do not download the idpselect.js script which actually
        // draws the EDS until the configuration has been downloaded.
        $.getScript("js/idpselect_config.js", function(data, textStatus, jqxhr) {
            $.getScript("js/idpselect.js", function(data, textStatus, jqxhr) {
                // Stop the spinner and show the EDS.
                spinner.stop();
                $("#idpSelect").show();
            });
        });
    }

    function populatePrevious(idps) {
        var ul = $("#previous_choice").find("ul");

        for (var i = 0; i < idps.length; i++) {
            var href = discoReturnUrl + "?entityID=" + encodeURIComponent(idps[i].entityID);
            ul.append(
                $('<li/>')
                    .append($('<a/>')
                        .attr("href", href)
                        .append($('<div/>')
                            .addClass("idp_img")
                            .append($('<img/>')
                                .attr("src", idps[i].img)
                                .attr("alt", idps[i].text)
                                .attr("width", "80")
                                .attr("height", "60")
                            )
                        )
                        .append($('<div/>')
                            .addClass("idp_text")
                            .text(idps[i].text)
                        )
                    )
            );
        }

    }

    function saveIdPAfterClick() {
        // Get the link to be used for discovery.
        var address = $(this).attr("href");

        // Parse the entityID from the link.
        var regex = new RegExp('entityID=(.*)');
        var results = regex.exec(address);
        var entityID = decodeURIComponent(results[1]);

        // Get the image link.
        var imageSrc = $(this).find("img").attr("src");

        // Get the IdP label text.
        var idpText = $(this).find("div.idp_text").text();

        // Get the current IdPs from local storage.
        var idps = getIdPsFromStorage();

        // Add the IdP to the list of current IdPs stored
        // in local storage if it is not already present.
        if (idps !== null) {
            if (idps.filter(function(idp){ return idp.entityID === entityID }).length == 0) {
                idps.push({entityID:entityID, img:imageSrc, text: idpText});
            }
        }

        // Save the IdPs to local storage.
        saveIdPsToStorage(idps);

    }

    function saveIdPsToStorage(idps) {
        if (localStorageAvailable) {
            localStorage.setItem("idps", JSON.stringify(idps));
        }
    }

    // Bind the function for setting the IdP cookie as the event
    // handler when a link of class idp_choice_link is clicked.
    $(".idp_choice_link").click(saveIdPAfterClick);

    // Accordion open/close handler
    $('.accordion-title').click(function () {
      // rather than select on .accordion.closed, we check for the
      // presence of the "closed" class here so we don't have to dynamically assign
      // the click handler to the common_choices when a user has previous choices
      // available on first load.
      if (!$(this).parent().hasClass('closed')) {
        return;
      }
      // close all accordions
      $('.accordion-content').slideUp();
      $('.accordion').addClass('closed');

      // open this accordion
      $(this).parent().find('.accordion-content').slideDown();
      $(this).parent().removeClass('closed');
    });

    /* The following Accordion open/close handler lets us open and
       close all accordions independently; keep this around in case
       we want to switch to that mode.
    $('.accordion-title').click(function () {
      // toggle this accordion
      $(this).parent().find('.accordion-content').slideToggle();
      $(this).parent().toggleClass('closed');
    });
    */

    /* When the accordion toggle for "Find my login server" is clicked,
       load the shibEDS if it has not yet been retrieved. */
    $("#find_choice .accordion-title").click(function () {
      if(!($('#idpSelect').hasClass('clicked'))) {
        // mark div immediately to avoid loading multiple times on fast clicks
        $("#idpSelect").addClass('clicked');
        // load the Shib EDS once
        loadShibEDS();
      }
    });

    // Determine if we have local storage.
    var localStorageAvailable = null;
    if (typeof(Storage) !== "undefined") {
        localStorageAvailable = true;
    } else {
        localStorageAvailable = false;
    }

    // Get the previously selected IdPs if any.
    var previouslySelectedIdPs = getIdPsFromStorage();

    // If previously selected IdPs exist then show them and
    // hide the common choices
    if (localStorageAvailable && previouslySelectedIdPs.length > 0) {
        populatePrevious(previouslySelectedIdPs);
        $("#previous_choice").show();
        $("#common_choice").addClass('closed');
        $("#common_choices_box").hide();
    }
});
