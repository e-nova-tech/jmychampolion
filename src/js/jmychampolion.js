/**
 * jMyChampolion.
 *
 * A simple activity working in the rosetta stone fashion.
 *
 * @param options
 * @returns {*}
 */
jQuery.fn.jMyChampolion = function(options) {
  /**
   * Default settings.
   * @type {{mediaSelector: string, matchSelector: string, soundHelpSelector: string, soundAutoPlay: boolean, donut: {width: number, height: number, text_y: string, duration: number, transition: number, thickness: number}, onNextSound: Function, onBeforeInit: Function, onAfterInit: Function, onAfterClickMatchCorrect: Function, onAfterClickMatchIncorrect: Function, onLoaded: Function, onFinish: Function}}
   */
  var defaults = {
      mediaSelector: '.sounds div.sound',
      matchSelector: '.match.selectable',
      soundHelpSelector: '.matches div.sound',
      slideSelector: '.matches .slide',
      soundAutoPlay: true,
      donut : {
        width : 300,
        height : 300,
        text_y : '.30em',
        duration : 500,
        transition : 200,
        thickness : 35
      },
      onNextSound: function(moveout, movein) {
        onNextSound(moveout, movein);
      },
      onBeforeInit: function() {
        onBeforeInit();
      },
      onAfterInit: function() {
        onAfterInit();
      },
      onAfterClickMatchCorrect: function(elt) {
        showSuccess(elt);
      },
      onAfterClickMatchIncorrect: function(elt) {
        showError(elt);
      },
      onLoaded: function() {
        onLoaded();
      },
      onFinish: function() {
        onFinish();
      }
    },
    settings = $.extend({}, defaults, options),

    // stores main lib jhearnclick.
    _jhnc = null,
    // stores app container.
    app = null,
    // current slide.
    currentSlide = 0,
    // total slides.
    totalSlides = 0,

    /********* Events Management ************/

    /**
     * On Before Init event.
     */
    onBeforeInit = function() {
      // Preload what needs to be.
      preload();
      // Hide all the slides, except the first one.
      $(settings.slideSelector, app).hide();
      $(settings.slideSelector + ':first', app).show();
      // Init variables.
      currentSlide = 1;
      totalSlides = $(settings.slideSelector, app).length;
      // Init paginator.
      paginatorInit();
      // Init help sound. (extra sound located on top of images).
      $(app).cofPlayer({
        mediaSelector : settings.soundHelpSelector,
        loader : {
          size : 200,
          container : app,
          onLoaded : settings.onLoaded
        }
      });
    },

    /**
     * On After Init event.
     */
    onAfterInit = function() {
      // Hide first sound.
      $(settings.mediaSelector + ':first').hide();
    },

    /**
     * On Loaded event.
     */
    onLoaded = function() {
      animateSoundEntrance(
        $(settings.mediaSelector + ':first'),
        function() {
          onAfterSoundAppearance();
        }
      );
    },

    /**
     * On after sound appearance event.
     * is called after a new sound appears at the top.
     */
    onAfterSoundAppearance = function() {
      if (settings.soundAutoPlay) {
        setTimeout(function() {
            $(settings.mediaSelector + ':eq(' + (currentSlide - 1) + ')')
              .cofPlay();
          },
          500
        );
      }
    },

    /**
     * on Next sound Event. (when a previous positive answer was given).
     *
     * Animate the sound object. (previous one exits the screen, new one enters the screen).
     *
     * @param moveoutp
     * @param movein
     */
    onNextSound = function(moveout, movein) {
      // Display animation of sound moving from top to where it belongs.
      // Display next set after 3 seconds.
      var matchElt = null;
      for (var i in settings.answers) {
        if (i == moveout.attr('id')) {
          matchElt = $('#' + settings.answers[i]);
        }
      }

      var diffLeft = $('.top', matchElt).offset().left - $('a', moveout).offset().left;
      var diffTop = $('.top', matchElt).offset().top - $('a', moveout).offset().top;

      $('a', moveout).animate({
        left: "+=" + diffLeft,
        top: "+=" + diffTop
      }, 800, function() {
        goToStep(currentSlide + 1, 500);
      });
    },

    /**
     * On Paginator Click Event.
     * @param elt
     * @returns {boolean}
     */
    onPaginatorClick = function(elt) {
      if (elt.parent().hasClass('disabled') || elt.parent().hasClass('active')) {
        return false;
      }
      else {
        // Go to step.
        goToStep(parseInt(elt.text()), 500);
        // Reset the step in main lib.
        _jhnc.progress = parseInt(elt.text());
      }
      return false;
    },

    /**
     * On Finish Event.
     */
    onFinish = function() {
      $('.matches').hide();
      $('.help').hide();
      $('.paginator').hide();
      $('.sounds').hide();
    },

    /************ Template functions ***********/

    /**
     * Get html for paginator.
     * @param nbItems
     * @returns {string}
     */
    paginatorGetHtml = function(nbItems) {
      var html = "<ul>";
      for (var i=1; i <= nbItems; i++) {
        html += ('<li class="' + (i == 1 ? 'active' : 'disabled') + '"><a href="#jmc-' + i + '">' + i + '</a></li>');
      }
      html += "</ul>";
      return html;
    },

    /**
     * Get error Html.
     * @returns {string}
     */
    getErrorHtml = function() {
      return '<div class="error"></div>';
    },

    /**
     * Get Success Html.
     * @returns {string}
     */
    getSuccessHtml = function() {
      return '<div class="success"></div>';
    },

    /************ Business functions ***********/

    /**
     * Init paginator.
     */
    paginatorInit = function() {
      $('.paginator').html(paginatorGetHtml(totalSlides));
      $('.paginator ul li a').click(function() {
        onPaginatorClick($(this));
      });
    },

    /**
     * Refreshes the paginator display according the current element.
     */
    paginatorRefresh = function() {
      var i = 1;
      $('.paginator ul li').each(function() {
        $(this).removeClass("active passed disabled");
        if (i < currentSlide) {
          $(this).addClass("passed");
        }
        else if (i == currentSlide) {
          $(this).addClass("active");
        }
        else {
          $(this).addClass("disabled");
        }
        i++;
      });
    },


    /**
     * Animate the sound element at the top.
     * Is used when we switch to a new slide and the new sound appears.
     * @param elt
     * @param callback
     */
    animateSoundEntrance = function(elt, callback) {
      $('a', elt).css('top', '-50px');
      $(elt).show();
      $('a', elt).animate({
        top: 0
      }, 400, callback);
    },

    /**
     * Show a success in an element.
     * @param elt
     */
    showSuccess = function(elt) {
      // Display a success symbol.
      elt.closest('.image').prepend(getSuccessHtml());
    },

    /**
     * Show an error in an element.
     * Then removes it after 1 second.
     * @param elt
     */
    showError = function(elt) {
      // Display an error symbol for 1 second.
      elt.closest('.image').prepend(getErrorHtml());
      // Remove after one second.
      setTimeout(function() {
        $('.error', elt.closest('.image')).remove();
      },
      1000);
    },

    /**
     * Reset slide corresponding to number given.
     * Removes any error, success, and repositions the sound element.
     * @param slideNumber
     */
    resetSlide = function(slideNumber) {
      $(settings.mediaSelector + ':eq(' + (slideNumber - 1) + ')')
        .find('a')
        .attr('style', '');
      $(settings.slideSelector + ':eq(' + (slideNumber - 1) + ') .match.success')
        .removeClass('success')
        .find('div.success')
        .remove();
    },

    /**
     * Preload whatever has to be preloaded.
     */
    preload = function() {
      var errorHtml = getErrorHtml();
      $('.match .image:first', app).append($(errorHtml).hide());
      var successHtml = getSuccessHtml();
      $('.match .image:first', app).append($(successHtml).hide());
    },

    /**
     * Go to step given as parameter.
     * @param step
     * @param delay
     */
    goToStep = function(step, delay) {
      var moveout = $(settings.mediaSelector + ':eq(' + (currentSlide - 1) + ')');
      var movein = $(settings.mediaSelector + ':eq(' + (step - 1) + ')');
      resetSlide(step);
      setTimeout(function() {
        $(settings.slideSelector + ':eq(' + (currentSlide - 1) + ')').animate(
          {
            opacity: 0
          },
          500,
          function() {
            $(this).hide();
            $(settings.slideSelector + ':eq(' + (step - 1) + ')').css('opacity', '1').show();
            animateSoundEntrance(movein, function() {
              onAfterSoundAppearance();
            });
            moveout.hide();
          });
        currentSlide = step;
        paginatorRefresh();
      },
      delay);
    },

    /**
     * Init plugin.
     * @param appContainer
     */
    init = function(appContainer) {
      app = appContainer;
      _jhnc = $(appContainer).jHearNClick(settings);
    };

  // Init application.
  return this.each(function() {
    var app = $(this);
    init(app);
    return $(this);
  });
}