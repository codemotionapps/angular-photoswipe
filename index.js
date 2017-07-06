const angular = require(`angular`);
const PhotoSwipe = require(`photoswipe`);
const PhotoSwipeUI_Default = require(`photoswipe/dist/photoswipe-ui-default.min`);

ngPhotoswipeDirective.$inject = [`$compile`, `$http`, `$templateCache`];
function ngPhotoswipeDirective($compile, $http, $templateCache) {
	return {
		restrict: 'AE',
		replace: true,
		scope: {
			open: '=',
			options: '=',
			slides: '=',
			slideSelector: '@',
			template: '@',
			onClose: '&'
		},
		link: linkFn
	};

	function linkFn(scope, iElement){
		scope.template = scope.template || 'views/ng-photoswipe.html';

		$http
			.get(scope.template, { cache: $templateCache })
			.then(function(result) {
				var template = angular.element(result.data);
				iElement.append($compile(template)(scope));
			});

		scope.start = function () {
			scope.open = true;
			startGallery();
		};

		var startGallery = function () {
			var pswpElement = document.querySelectorAll('.pswp')[0];

			if (angular.isUndefined(scope.options.getThumbBoundsFn) &&
					angular.isDefined(scope.slideSelector)) {

				scope.options = angular.merge({}, {

					getThumbBoundsFn: function(index) {
						var thumbnail = document.querySelectorAll(scope.slideSelector)[index];
						var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
						var rect = thumbnail.getBoundingClientRect();
						return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
					}

				}, scope.options);
			}

			scope.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default || false, scope.slides, scope.options);
			scope.gallery.init();
			scope.item = scope.gallery.currItem;

			scope.gallery.listen('destroy', function () {
				scope.safeApply(function () {
					(scope.onClose || angular.noop)();
				});
			});

			scope.gallery.listen('afterChange', function () {
				scope.safeApply(function () {
					scope.item = scope.gallery.currItem;
				});
			});
		};

		scope.$watch('open', function (nVal, oVal) {
			if (nVal != oVal) {
				if (nVal) {
					startGallery();
				}
			} else if (!nVal && scope.gallery) {
				scope.gallery.close();
				scope.gallery = null;
			}
		});

		scope.safeApply = function(fn) {
			var phase = this.$root.$$phase; // TODO: Remove this bad practice
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};

		scope.$on(`destroy`, () => scope.gallery = null);
	}
}

const moduleName = 'angular-photoswipe';

angular
	.module(moduleName, [])
	.directive('ngPhotoswipe', ngPhotoswipeDirective);

module.exports = moduleName;