(function () {
    'use strict';

    angular.module('ngFrontPage', ['duScroll'])
        .service('frontPageService', ['$document', '$rootScope', '$timeout', '$window', '$injector', function frontPageService($document, $rootScope, $timeout, $window, $injector){
            var bodyElement = angular.element($document[0].body);
            var htmlElement = angular.element(bodyElement.parent());
            var fullPageElements = [];
            var fullPageSetup = [];
            var timer, htimer;
            var routeHandlerPromise;
            var $state = $injector.get('$state');
            var service = {
                enabled: false,
                scrollCapture: false,
                activeElementIndex: undefined,
                aligned: false,
                enable: function() {
                    if(!service.enabled) {
                        bodyElement.addClass('front-page-enabled');
                        htmlElement.addClass('front-page-init');
                        $rootScope.$broadcast('front-page-initialized');
                        $document.on('scroll', scrollHandler);
                        $document.on('keydown', keydownHandler);
                        angular.element($window).bind('resize', resizeHandler);
                        routeHandlerPromise = $rootScope.$on('$stateChangeStart', routeHandler);
                        service.enabled = true;
                        fullPageElements = [];
                    }
                },
                destroy: function() {
                    bodyElement.removeClass('front-page-enabled');
                    htmlElement.removeClass('front-page-init');
                    $rootScope.$broadcast('front-page-destroyed');
                    $document.off('scroll', scrollHandler);
                    angular.element($document).off('keydown', keydownHandler);
                    angular.element($window).bind('resize', resizeHandler);
                    if(timer) $timeout.cancel(timer);
                    if(htimer) $timeout.cancel(htimer);
                    routeHandlerPromise();
                    service.enabled = false;
                    fullPageElements = [];
                },
                registerFullPage: function(element, setup) {
                    setup = setup || {};
                    fullPageElements.push(element);
                    fullPageSetup.push(setup)
                    if((fullPageSetup.length === 1) || ($state && (setup.routeName === $state.current.name))) {
                        service.aligned = false;
                        service.safeScroll(element.offsetTop, false, true);
                    }

                },
                safeScroll: function(top, dir, keep_url) {
                    if(service.aligned) return;

                    $document.off('scroll', scrollHandler);
                    $timeout.cancel(timer);
                    timer = $timeout(function(){
                        $document.on('scroll', scrollHandler);
                    }, 500);
                    var captured = false;

                    for(var i = 0; i < fullPageElements.length; i++) {
                        var element = fullPageElements[i];
                        if(
                            ((dir === 'up') && (top >= element.offsetTop) && (top < (element.offsetTop + element.clientHeight))) ||
                            ((dir !== 'up') && (element.offsetTop >= top) && (element.offsetTop < (top + element.clientHeight)))
                        ) {
                            if(angular.isDefined(service.activeElementIndex)) {
                                bodyElement.removeClass(fullPageSetup[service.activeElementIndex].exitClass);
                            }
                            service.activeElementIndex = i;
                            service.scrollCapture = true;
                            service.align = true;
                            bodyElement.addClass(fullPageSetup[service.activeElementIndex].enterClass);
                            if(!keep_url && $state && fullPageSetup[service.activeElementIndex].routeName) {
                                $state.transitionTo(fullPageSetup[service.activeElementIndex].routeName, fullPageSetup[service.activeElementIndex].routeParams, {notify: false})
                            }
                            captured = true;
                            break;
                        }
                    }
                    if(!captured) {
                        service.scrollCapture = false;
                        if(angular.isDefined(service.activeElementIndex)) {
                            bodyElement.removeClass(fullPageSetup[service.activeElementIndex].exitClass);
                        }
                        service.activeElementIndex = undefined;
                    }

                    var scroll = service.scrollCapture ? fullPageElements[service.activeElementIndex].offsetTop : top;
                    $document.scrollTop(scroll,350).then(function(){
                        $timeout.cancel(timer);
                        $document.on('scroll', scrollHandler);
                    });
                }
            };
            var resizeHandler = function(){
              service.safeScroll($document.scrollTop());
            };
            var scrollTrigger = function(top, start) {
                var direction;
                if(top > start) {
                    direction = 'down';
                }

                if(top < start) {
                    direction = 'up';
                }
                service.align = false;
                service.safeScroll(top, direction);
                htimer = null;
            };

            var scrollHandler = function(e){
                var start = $document.scrollTop(), old = start;
                var loop = function(){
                    var top = $document.scrollTop();
                    if(top === old) {
                        $timeout.cancel(htimer);
                        htimer = undefined;
                        scrollTrigger(top, start);
                    }
                    else {
                        htimer = $timeout(loop, 50);
                        old = top;
                    }
                };
                if(!htimer) {
                    htimer = $timeout(loop, 50);
                }
            };
            var horizontalControl = function(e, dir) {
                e.preventDefault();
                if(service.scrollCapture) {
                    fullPageSetup[service.activeElementIndex].element.triggerHandler('move-'+dir);
                }
            };
            var keydownHandler = function(e) {
                if(service.scrollCapture) {
                    var charCode = e.charCode || e.keyCode;

                    if(charCode === 37) { //left arrow
                        horizontalControl(e, 'left');
                    }
                    if(charCode === 39) { //right arrow
                        e.preventDefault();
                        horizontalControl(e, 'right');
                    }
                }
            };

            var routeHandler = function(event, toState){
                for(var i = 0; i < fullPageSetup.length; i++) {
                    if(fullPageSetup[i].routeName === toState.name) {
                        service.safeScroll(fullPageElements[i].offsetTop);
                        break;
                    }
                }
            };
            return service;
        }])
        .directive('frontPage', ['$window', '$document', 'frontPageService', '$timeout', '$interval', function frontPage($window, $document, frontPageService, $timeout, $interval){
            return {
                restrict: 'A',
                scope: true,
                link: function($scope, element, attrs) {
                    var loopFunction = function() {
                        if($scope.intervalPromise) return;
                        if($scope.settings.slideCount > 1 && $scope.settings.autoLoop) {
                            $scope.intervalPromise = $interval(function(){
                                $scope.slideController.nextSlide(true);
                            }, $scope.settings.autoLoopPeriod || 3000);
                        }
                    };

                    $scope.settings = {activeSlide: 0, slideRange: [0, 1], slideCount: 1};
                    $scope.slideController = {
                        ready: function(data) {
                            $scope.settings.slideCount = data.count;
                            $scope.settings.slideRange = [];
                            for(var i = 0; i < data.count; i++) {
                                $scope.settings.slideRange.push(i);
                            }
                        },
                        goSlide: function(slideNum) {
                            $interval.cancel($scope.intervalPromise);
                            $scope.intervalPromise = undefined;
                            $scope.timeoutPromise = $timeout(loopFunction, 5000);
                            $scope.settings.activeSlide = slideNum;
                            $scope.$broadcast('change-slide', {'slide': slideNum});
                        },
                        nextSlide: function(loop) {
                            if(!loop) {
                                $interval.cancel($scope.intervalPromise);
                                $scope.intervalPromise = undefined;
                                $scope.timeoutPromise = $timeout(loopFunction, 5000);
                            }
                            $scope.settings.activeSlide = ($scope.settings.activeSlide + 1) % $scope.settings.slideCount;
                            $scope.$broadcast('change-slide', {'slide': $scope.settings.activeSlide});
                        },
                        previousSlide: function() {
                            $interval.cancel($scope.intervalPromise);
                            $scope.intervalPromise = undefined;
                            $scope.timeoutPromise = $timeout(loopFunction, 5000);
                            $scope.settings.activeSlide = ($scope.settings.activeSlide - 1 + $scope.settings.slideCount) % $scope.settings.slideCount;
                            $scope.$broadcast('change-slide', {'slide': $scope.settings.activeSlide});
                        }
                    };

                    element.on('move-left', function(){
                        $scope.slideController.previousSlide();
                        $scope.$apply();
                    });
                    element.on('move-right', function(){
                        $scope.slideController.nextSlide();
                        $scope.$apply();
                    });

                    $timeout(function(){
                        frontPageService.enable();
                        frontPageService.registerFullPage(element[0], {
                            element: element,
                            enterClass: attrs.enterClass,
                            exitClass: attrs.exitClass || attrs.enterClass,
                            routeName: attrs.routeName
                        });
                        $scope.settings.autoLoop = attrs.autoLoop;
                        $scope.settings.autoLoopPeriod = attrs.autoLoopPeriod || 3000;
                        loopFunction();
                    });

                    $scope.$on('$destroy', function(){
                        if($scope.intervalPromise) $interval.cancel($scope.intervalPromise);
                        if($scope.timeoutPromise) $timeout.cancel($scope.timeoutPromise);
                        element.off('move-left');
                        element.off('move-right');
                    })
                }
            }
        }])
        .directive('slideContainer', ['$window', '$document', '$timeout', function frontPageSlideContainer($window, $document, $timeout){
            return {
                restrict: 'C',
                link: function($scope, element) {
                    var slides = element.children();
                    var slideCount = slides.length;
                    $timeout(function(){
                        if(slideCount > 1) {
                            element[0].style.width = (slideCount * 100) + '%';
                            angular.forEach(slides, function(slide){
                                slide.style.width = (100 / slideCount) + '%';
                            });
                            $scope.slideController.ready({count: slideCount});
                        }
                    });

                    $scope.$on('change-slide', function(e, data){
                        if(angular.isNumber(data.slide)) {
                            element[0].style['margin-left'] = "-" + (data.slide * 100) + "%";
                        }
                    })
                }
            }
        }])
        .directive('horizontalNav', [function frontPageHorizontalNav(){
            return {
                restrict: 'C',
                template: '<a href="javascript:;" data-ng-repeat="i in settings.slideRange" data-ng-class="{\'active\': i === settings.activeSlide}" data-ng-click="slideController.goSlide(i)"></a>'
            }
        }])
        .directive('prevButton', [function frontPagePrevButton(){
            return {
                restrict: 'C',
                template: '<a href="javascript:;" data-ng-click="slideController.previousSlide()"></a>'
            }
        }])
        .directive('nextButton', [function frontPageNextButton(){
            return {
                restrict: 'C',
                template: '<a href="javascript:;" data-ng-click="slideController.nextSlide()"></a>'
            }
        }]);

})();
