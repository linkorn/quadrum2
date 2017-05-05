;(function($) {

    $.carouselSlider = function(el, options) {

        var defaults = {
            currActive: 0,
            numImg: 0,
            maxW: .85,
            maxImgW: 0, 
            loaded: false,
            scaleVal: 1,
            margin: 5,
            speed: .6,
            xPos: 0,
            moving: false,
            imgHeight: 700
        }

        var plugin = this;
        plugin.settings = {}

        var s, $this;

        var init = function() {
            plugin.settings = $.extend({}, defaults, options);
            s = plugin.settings;
            plugin.el = el;
            $this = plugin.el;

            s.numImg = $("img", $this).length;

            $("img", $this).each(function(i){
                $(this).attr("data-id", i);
            });

            var $childClones = $this.children().clone();
            var $childClones2 = $this.children().clone();
            $this.append($childClones);
            $this.append($childClones2);

            $("img", $this).each(function(i){
                $(this).attr("data-pos", (i<s.numImg) ? "prev" : (i>=s.numImg && i<s.numImg*2) ? "real" : "next" );
            });


            $this.wrapInner("<div class='cs-wrapper-outer'><div class='cs-wrapper'></div></div>");

            $(".cs-wrapper-outer, .cs-wrapper", $this).css({"transform-origin": "0 0", "font-size" : 0});
            $(".cs-wrapper", $this).width(45000).css("line-height", 0);

            $(window).bind("resize", resize);

            $(window).bind("load", load);

            $(document).on("click", ".activeLeft", prevChart);
            $(document).on("click", ".activeRight", nextChart);

            $(".cs-wrapper", $this).swipe( {
                //Generic swipe handler for all directions
                swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
                    if(direction == "left"){
                        nextChart();
                    }else if(direction == "right"){
                        prevChart();
                    }
                },
                //Default is 75px, set to 0 for demo so any distance triggers swipe
                threshold: 50,
                allowPageScroll:"vertical"
                });

            buildPagina();
        }

        var nextChart = function(){
            if(!s.moving){
                var i = s.currActive+1;
                moveToSlide(i, false);
            }
        }


        var prevChart = function(){
            if(!s.moving){
                var i = s.currActive-1;
                moveToSlide(i, false);
            }
        }


        var buildPagina = function(){
            $this.append('<ul class="slick-dots padding" role="tablist" style="display: block;">');

            for(var i=1; i<=s.numImg; i++){
                $("ul.slick-dots", $this).append('<li><a>'+i+'</a></li>');
            }
            $("ul.slick-dots li").eq(s.currActive).addClass("active");

            $("ul.slick-dots li").click(function(e){
                if(!$(this).hasClass("active") && !s.moving){
                    $("ul.slick-dots li.active").removeClass("active");
                    var i = $(this).index();
                    $(this).addClass("active");
                    moveToSlide(i, true);
                }
            });
        }

        var setPagina = function(){
            var index;
            if (s.currActive < 0){
                index = s.numImg-1;
            }else if(s.currActive > s.numImg-1){
                index = 0;
            }else{
                index = s.currActive;
            }
            $("ul.slick-dots li.active").removeClass("active");
            $("ul.slick-dots li").eq(index).addClass("active");

        }


        var moveToSlide = function(index, pager){
            if(!s.moving){
                s.moving = true;
                TweenMax.set( $(".cs-wrapper", $this), {x: 0} );

                if(pager){
                    $("img.active", $this).removeClass("active");
                    $("img[data-id='"+index+"'][data-pos='real']", $this).addClass("active");
                }else{
                    if(index < s.currActive) {
                        // prev
                        $("img.active", $this).removeClass("active").prev().addClass("active");
                    }else{
                        // next
                        $("img.active", $this).removeClass("active").next().addClass("active");
                    }
                }

                s.currActive = index;
                setPagina();

                var xPosTemp = parseInt($("img.active", $this).position().left + s.margin);
                xPosTemp -= ($(window).width() - ($("img.active", $this).width())*s.scaleVal) * .5;

                TweenMax.set( $(".cs-wrapper", $this), {x: -s.xPos} );

                s.xPos = xPosTemp;
                TweenMax.to( $(".cs-wrapper", $this), s.speed, {x: -s.xPos, ease: Power2.easeInOut, onComplete: switchToRealImgsAgain } );

                setPrevNextClasses();
            }

        }

        var switchToRealImgsAgain = function(){
            var currImg = $("img.active", $this);
            if (s.currActive < 0){
                s.currActive = s.numImg-1;
                centerCurrImg();
            }
            if(s.currActive > s.numImg-1){
                s.currActive = 0;
                centerCurrImg();
            }
            s.moving = false;
            setPrevNextClasses();

            // if(currImg.attr("data-pos") != "real"){
            //     // need to switch 
            //     centerCurrImg();
            //     //var imgPos = currImg.attr("data-id");
            // }
        }

        var setPrevNextClasses = function(){
            $("img.activeLeft, img.activeRight").removeClass("activeLeft activeRight");
            var currImg = $("img.active", $this);
            currImg.prev().addClass("activeLeft");
            currImg.next().addClass("activeRight");
        }


        var determineMaxImgWidth = function(){
            var maxImgWidhtTemp = 0;
            $("img", $this).each(function(i){
                s.maxImgW = ($(this).width() > s.maxImgW) ? $(this).width() : s.maxImgW;
            })
        }

        var load = function(e){
            s.loaded = true;
            determineMaxImgWidth();
            resize();
            setPrevNextClasses();
        }

        var resize = function(e){
            if(s.loaded){
                setImgWidth();
                centerCurrImg();
                //setHeight2();
            }
        }

        var setImgWidth = function(){
            var ww = $(window).width() * s.maxW;
            var scaleTemp = (ww / s.maxImgW > 1) ? 1 : ww / s.maxImgW;

            TweenMax.set( $this, {transformOrign:'0% 0%'});
            TweenMax.set( $(".cs-wrapper", $this), {transformOrign:'0% 0%', scale: scaleTemp});
            s.scaleVal = scaleTemp;

            setHeight2(scaleTemp* s.imgHeight);

        }


        var centerCurrImg = function() {
            $("img.active").removeClass("active");
            // transform x needs to be zero to work on resize :/
            TweenMax.set( $(".cs-wrapper", $this), {x: 0} );
            $("img[data-id='"+s.currActive+"'][data-pos='real']", $this).addClass("active");
            s.xPos = parseInt($("img.active", $this).position().left + s.margin);
            
            s.xPos -= ($(window).width() - ($("img.active", $this).width())*s.scaleVal) * .5;

            TweenMax.set( $(".cs-wrapper", $this), {x: -s.xPos } );
        }

        var setHeight = function(){
            var rect = $(".cs-wrapper", $this)[0].getBoundingClientRect();
            $(".cs-wrapper-outer", $this).height(rect.height);
        }

        var setHeight2 = function(height){
            // var rect = $(".cs-wrapper", $this)[0].getBoundingClientRect();
            // console.log("rect.height: " + rect.height);
            $(".cs-wrapper-outer", $this).height(height + 0);
        }


        plugin.destroyPlugin = function() { 
            
        }

        init();
    }
})(jQuery);