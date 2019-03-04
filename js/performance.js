(function() {

	handleAddListener('load', getTiming);

	//判断浏览器类型，IE使用attachEvent
	function handleAddListener(type, fn) {
		if (window.addEventListener) {
			window.addEventListener(type, fn)
		} else {
			window.attachEvent('on' + type, fn)
		}
	};
	//页面加载性能统计
	function getTiming() {
		try {
			var time = performance.timing;
			var timingObj = [];

			var loadTime = (time.loadEventEnd - time.loadEventStart) / 1000;

			if (loadTime < 0) {
				setTimeout(function() {
					getTiming();
				}, 200);
				return;
			}
			var dnsTimer = {
				key: "DNS查询耗时",
				value: time.domainLookupEnd - time.domainLookupStart
			};
			var redirectTimer = {
				key: "重定向耗时",
				value: time.redirectEnd - time.redirectStart
			};
			var pageEmptyTimer = {
				key: "白屏耗时",
				value: time.responseStart - time.navigationStart
			};
			var firstPageTimer = {
				key: "首屏耗时",
				value: time.domInteractive - time.navigationStart
			};
			var tcpTimer = {
				key: "TCP链接耗时",
				value: time.connectEnd - time.connectStart
			};
			var requestTimer = {
				key: "HTTP请求响应完成耗时",
				value: time.responseEnd - time.requestStart
			};

			var domStructureTimer = {
				key: "DOM结构解析完成耗时",
				value: time.domInteractive - time.domLoading
			};

			var domReadyTimer = {
				key: "用户可交互时间",
				value: time.domContentLoadedEventEnd - time.navigationStart
			};
			var allTimer = {
				key: "页面完全加载耗时",
				value: time.loadEventEnd - time.navigationStart
			};
			timingObj = timingObj.concat(dnsTimer, redirectTimer, pageEmptyTimer, firstPageTimer, tcpTimer, requestTimer,
				domStructureTimer, domReadyTimer, allTimer);

			timingObj.map(function(item) {
				item.value += "ms";
				return item;
			})
			//获取浏览器信息
			var browser = getBrowserInfo(); //取到完整信息
			var b_name = (browser + "").replace(/[0-9./]/ig, ""); //根据正则将所有数字、‘.’‘/’全部去掉，剩下浏览器名
			var b_version = parseInt((browser + "").replace(/[^0-9.]/ig, "")); //根据正则将所有非数字全部去掉，剩下版本  
			console.log("正在使用" + b_name + "浏览器，" + "版本是" + b_version);
			
			//测量网速
			measureBW();
			
			console.log("-------页面初始化------------------------");
			console.table(timingObj);
			var resourcesArr = TestResource(performance.getEntries());
			var loadMethodArr = pageLoadMethod(performance.navigation.type);
			console.log("-------页面请求------------------------");
			console.table(resourcesArr);
			console.log("-------页面加载方式------------------------");
			console.table(loadMethodArr);



		} catch (e) {
			console.log(timingObj)
			console.log(performance.timing);
		}
	}

	//请求的各种资源（js,图片，样式等）
	function TestResource(resourcesObj) {
		var resourceArr = [];
		var len = resourcesObj.length;
		for (var i = len - 1; i > 0; i--) {
			var temp = {};
			var cur = resourcesObj[i];
			if (!cur.responseEnd) {
				continue;
			}
			temp.key = cur.name;
			temp.resValue = cur.responseEnd - cur.requestStart + "ms";
			resourceArr.push(temp);
		}
		return resourceArr;
	}

	//页面的加载方式
	function pageLoadMethod(type) {
		var arr = [];
		var loadMethod = {};
		loadMethod.name = "进入页面的方式";
		var str = "";
		switch (type) {
			case 0:
				str = '点击链接、地址栏输入、表单提交、脚本操作等方式加载';
				break;
			case 1:
				str = '通过“重新加载”按钮或者location.reload()方法加载';
				break;
			case 2:
				str = '网页通过“前进”或“后退”按钮加载';
				break;
			default:
				str = '任何其他来源的加载';
				break;
		}
		loadMethod.value = str;
		arr.push(loadMethod);
		return arr;
	}
	//浏览器类型及版本
	function getBrowserInfo() {
		var agent = navigator.userAgent.toLowerCase();
		var regStr_ie = /msie [\d.]+;/gi;
		var regStr_ff = /firefox\/[\d.]+/gi
		var regStr_chrome = /chrome\/[\d.]+/gi;
		var regStr_saf = /safari\/[\d.]+/gi;
		var isIE = agent.indexOf("compatible") > -1 && agent.indexOf("msie" > -1); //判断是否IE<11浏览器  
		var isEdge = agent.indexOf("edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
		var isIE11 = agent.indexOf('trident') > -1 && agent.indexOf("rv:11.0") > -1;
		if (isIE) {
			var reIE = new RegExp("msie (\\d+\\.\\d+);");
			reIE.test(agent);
			var fIEVersion = parseFloat(RegExp["$1"]);
			if (fIEVersion == 7) {
				return "IE/7";
			} else if (fIEVersion == 8) {
				return "IE/8";
			} else if (fIEVersion == 9) {
				return "IE/9";
			} else if (fIEVersion == 10) {
				return "IE/10";
			}
		} //isIE end 
		if (isIE11) {
			return "IE/11";
		}
		//firefox
		if (agent.indexOf("firefox") > 0) {
			return agent.match(regStr_ff);
		}
		//Safari
		if (agent.indexOf("safari") > 0 && agent.indexOf("chrome") < 0) {
			return agent.match(regStr_saf);
		}
		//Chrome
		if (agent.indexOf("chrome") > 0) {
			return agent.match(regStr_chrome);
		}
	}
	//测网速，仅谷歌可用
	function measureBW() {
		var speed = navigator.connection.downlink * 1024 / 8; //单位为KB/sec
		console.log("网速为" + speed + "KB/s");
	}
	

})();
