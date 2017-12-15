import { sessionCache } from 'idiv-utils';

const routerCache = (function () {
	var
		isDirectUrl = false,
		prevHistoryLength = window.history.length,
		callBack = null,
		isLoading = false,
		timer = null;

	const
		getRouterCache = function () {
			var routerCache = sessionCache.get('routerCache');
			if (!routerCache || window.history.length === 1) {
				routerCache = {
					routerArr: [],
					isBack: false,
					isFresh: false,
					isForward: true,
					prevPosition: 0,
					scrollArr: [],
					count: 1,
				};
				sessionCache.put('routerCache', routerCache);
			}
			return routerCache;
		},
		modifyUrlParmas = function (url, paramsName, paramsValue) {
			var returnUrl = '';
			const params = `${paramsName}=${paramsValue}`;
			if (url.indexOf(paramsName) === -1) {
				const paramsSymbol = url.indexOf('?') === -1 ? '?' : '&';
				returnUrl = url + paramsSymbol + params;
			} else {
				const reg = new RegExp(`${paramsName}=` + '\\w+');
				returnUrl = url.replace(reg, params);
			}
			return returnUrl;
		},
		handleRouter = function () {
			// 无效跳转
			if (isDirectUrl || !window.location.hash) {
				isDirectUrl = false;
				return null;
			}

			var url = window.location.href;
			const
				routerCache = getRouterCache(),
				routerArr = routerCache.routerArr,
				scrollArr = routerCache.scrollArr,
				len = routerArr.length,
				historyLength = window.history.length,
				index = routerArr.lastIndexOf(url);

			routerCache.isBack = false;
			routerCache.isFresh = false;
			if (isLoading) {
				if (url === routerArr[len - 2]) {
					url = modifyUrlParmas(url, 'historyCount', ++routerCache.count);
					history.replaceState(null, '', url);
				}

				routerArr[len - 1] = url;
				scrollArr[len - 1] = window.scrollY;
				sessionCache.put('routerCache', routerCache);
				return routerCache;
			}
			isLoading = true;
			clearTimeout(timer);
			timer = setTimeout(() => {
				isLoading = false;
			}, 30);
			// 页面前进
			if (index === -1) {
				routerCache.isForward = true;
				prevHistoryLength = historyLength;
				routerCache.routerArr.push(url);
				scrollArr.push(window.scrollY);
				sessionCache.put('routerCache', routerCache);
				return routerCache;
			}

			// 判断前进或者后退按钮; 有一种情况判断不出, 输入链接之后返回再输入
			if (prevHistoryLength === historyLength) {
				if (index === len - 1) {
					routerCache.isFresh = true;
					routerCache.isForward = false;
				} else if (index === len - 2) {
					routerCache.isBack = true;
					routerCache.isForward = false;
					routerArr.pop();
					routerCache.prevPosition = scrollArr.pop();
				} else {
					routerCache.isForward = true;
					routerCache.isBack = false;
					routerArr.push(url);
					scrollArr.push(window.scrollY);
				}
				sessionCache.put('routerCache', routerCache);
				return routerCache;
			}

			routerCache.isForward = true;
			if (index === len - 2 || index === len - 1) {
				url = modifyUrlParmas(url, 'historyCount', ++routerCache.count);
				history.replaceState(null, '', url);
			}

			prevHistoryLength = historyLength;
			routerArr.push(url);
			scrollArr.push(window.scrollY);
			sessionCache.put('routerCache', routerCache);
			return routerCache;
		},
		listenHistory = function () {
			const routerCache = handleRouter();
			if (routerCache && callBack) {
				callBack(routerCache);
			}
		};

	return {
		listenHistory: handleRouter,
		directUrl(url, isReplace = false, isHref = true) {
			var
				routerCache = null,
				routerArr = [],
				len = 0,
				steps = 0,
				index = -1,
				isForward = false;

			isDirectUrl = true;
			prevHistoryLength = window.history.length;
			if (url[0] === '#') {
				url = window.location.href.replace(/#.+/, url);
			}

			// 不支持replaceState就用location的代理
			if (!window.history.replaceState) {
				if (isReplace) {
					window.location.replace(url);
				} else {
					window.location.href = url;
				}
				return false;
			}

			routerCache = getRouterCache();
			routerArr = routerCache.routerArr;
			len = routerArr.length;
			index = routerArr.lastIndexOf(url);
			isForward = isHref || index === -1;

			routerCache.isFresh = false;
			routerCache.isForward = isForward || isReplace;
			switch (true) {
				case isReplace:
					routerCache.routerArr[len - 1] = url;
					sessionCache.put('routerCache', routerCache);
					window.location.replace(url);
					break;
				case isForward:
					// 前进
					routerCache.isBack = false;
					sessionCache.put('routerCache', routerCache);
					window.location.href = url;
					break;
				case !isForward:
					// 这种情况认为是返回
					routerCache.isBack = true;
					steps = index - routerArr.length + 1;
					routerCache.routerArr = routerArr.slice(0, index + 1);
					sessionCache.put('routerCache', routerCache);
					steps && window.history.go(steps);
					break;
				default:
					throw Error('入参有误！');
			}
			// 执行注入的回调
			callBack && callBack(routerCache);
		},
		hasRegisterListener: false,
		setHistory() {
			if (!window.history.replaceState || this.hasRegisterListener) return;
			window.removeEventListener('popstate', listenHistory);
			listenHistory();
			window.addEventListener('popstate', listenHistory);
			this.hasRegisterListener = true;
		},
		destroy() {
			delete window.sessionStorage.routerCache;
			window.removeEventListener('popstate', listenHistory);
		},
		registerHistoryLitener(fn) {
			callBack = fn;
		},
		getRouterCache() {
			return getRouterCache();
		},
	};
}());

export default routerCache;