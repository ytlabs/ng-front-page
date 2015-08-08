(function () {
    'use strict';

    angular.module('ngFrontPage', ['duScroll'])
        .service('frontPageService', ['$document', '$rootScope', '$timeout', function frontPageService($document, $rootScope, $timeout){
            var bodyElement = angular.element($document[0].body);
            var htmlElement = angular.element(bodyElement.parent());
            var fullPageElements = [];
            var timer, htimer;
            var service = {
                enabled: false,
                scrollCapture: false,
                activeElementIndex: null,
                aligned: false,
                enable: function() {
                    if(!service.enabled) {
                        bodyElement.addClass('front-page-enabled');
                        htmlElement.addClass('front-page-init');
                        $rootScope.$broadcast('front-page-initialized');
                        $document.on('scroll', scrollHandler);
                        $document.on('keydown', keydownHandler);
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
                },
                registerFullPage: function(element) {
                    fullPageElements.push(element);
                    service.safeScroll($document.scrollTop());
                },
                safeScroll: function(top, dir, speed) {
                    if(service.aligned) return;

                    $document.off('scroll', scrollHandler);
                    $timeout.cancel(timer);
                    timer = $timeout(function(){
                        $document.on('scroll', scrollHandler);
                    }, 500);

                    for(var i = 0; i < fullPageElements.length; i++) {
                        var element = fullPageElements[i];
                        if(
                            ((dir === 'up') && (top >= element.offsetTop) && (top < (element.offsetTop + element.clientHeight))) ||
                            ((dir !== 'up') && (element.offsetTop >= top) && (element.offsetTop < (top + element.clientHeight)))
                        ) {
                            service.activeElementIndex = i;
                            service.scrollCapture = true;
                            service.align = true;
                            break;
                        }
                        else {
                            service.scrollCapture = false;
                        }
                    }

                    var scroll = service.scrollCapture ? fullPageElements[service.activeElementIndex].offsetTop : top;
                    $document.scrollTop(scroll,350).then(function(){
                        $timeout.cancel(timer);
                        $document.on('scroll', scrollHandler);
                    });
                }
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
                    angular.element(fullPageElements[service.activeElementIndex]).triggerHandler('move-'+dir);
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
            return service;
        }])
        .directive('frontPage', ['$window', '$document', 'frontPageService', '$timeout', function frontPage($window, $document, frontPageService, $timeout){
            return {
                restrict: 'A',
                link: function($scope, element) {
                    $scope.settings = {activeSlide: 0, slideRange: [0, 1], slideCount: 2};
                    $scope.slideController = {
                        ready: function(data) {
                        },
                        goSlide: function(slideNum) {
                            $scope.settings.activeSlide = slideNum;
                            $scope.$broadcast('change-slide', {'slide': slideNum});
                        },
                        nextSlide: function() {
                            $scope.settings.activeSlide = ($scope.settings.activeSlide + 1) % $scope.settings.slideCount;
                            $scope.$broadcast('change-slide', {'slide': $scope.settings.activeSlide});
                        },
                        previousSlide: function() {
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
                        frontPageService.registerFullPage(element[0]);
                    });

                    $scope.$on('$destroy', function(){
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
