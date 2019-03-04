# 前端性能检测调研

## 1.背景

根据《高性能网站建设指南》上的数据，整个页面的加载可以划分为3大块：网络时间、后端时间、前端时间，发生在网络和后端的时间占到整体加载时间的10%和20%，而前端资源加载时间占到整体加载时间的70%-80%。
前端资源加载是否快速对性能影响是最大的，这里面资源的加载顺序，并发数量，都有很多的工作可做。

高性能网站会给客户带来好的用户体验，从而提高产品的评价，影响公司的收益。

## 2.功能

优化性能的前提是，我们要知道性能瓶颈具体在哪。是执行复杂的 JavaScript，下载缓慢的 Web 字体，巨大的图片，还是卡顿的渲染？研究摇树（Tree Shaking），作用域提升（Scope Hoisting），或是各种各样的与 IntersectionObserver、Clients Hints、CSS containment、HTTP/2 和 Service Worker 一同工作的华丽的加载模式能够提高性能吗？这些问题我们都要从性能检测来得出答案。

总而言之，性能检测可以使我们知道从哪里开始优化性能，以及通过总结整理，建立长期的性能文化。

## 3.调研

#### 可行性调研

目前市场上有一些相应的工具、第三方网站以及API等方法来检测性能，按照监控方式可以大致分为两类：

| 类型     | 优点                                                         | 缺点                                                         | 示例                     |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------ |
| 非侵入式 | 指标齐全、客户端主动监测、竞品监控                           | 无法知道性能影响用户数、采样少容易失真、无法监控复杂应用与细分功能 | OneAPM，Yslow，pageSpeed |
| 侵入式   | 真实海量用户数据、能监控复杂应用与业务功能、用户点击与区域渲染 | 需插入脚本统计、网络指标不全、无法监控竞品                   | DP 、Google 统计         |

此次检测主要是为了解决在开发阶段，检测前端性能的问题。在对比多个方法后，最终选择了侵入式中的Performance API来实施前端性能检测。

#### 需求调研

性能不仅仅是一个技术问题：它很重要，而且当把它引入到工作流时，设计决策必须根据其性能影响来决定。以前，性能往往只是事后的想法。通常直到项目最后的时候才会被考虑，然后被归结为压缩、合并、静态资源优化或者对服务器配置文件的一些细微调整。

但是Web 日益复杂的情况带来了新的挑战，使得性能指标难以被跟踪，因为性能指标将因设备、浏览器、协议、网络类型和延迟（CDN、运营商、缓存、代理、防火墙、负载平衡器和服务器都在其中发挥作用）而有很大差异。

我们必须不断的测量、监视和改进性能。

## 4.设计

#### 常用指标

1. 白屏时间：用户从打开页面开始到页面开始有东西呈现为止；
2. 首屏时间：用户浏览器首屏内所有内容都呈现出来所花费的时间；
3. 用户可交互时间：用户可以进行正常的点击、输入等操作，默认可以统计domready时间，因为通常会在这时候绑定事件操作；
4. 总下载时间：页面所有资源都加载完成并呈现出来所花的时间，即页面 onload 的时间。

#### 2-5-8原则

当用户访问一个页面：

在2秒内得到响应时，会感觉系统响应很快；

在2-5秒之间得到响应时，会感觉系统的响应速度还可以；

在5-8秒以内得到响应时，会感觉系统的响应速度很慢，但可以接受；

而超过8秒后仍然无法得到响应时，用户会感觉系统糟透了，进而选择离开这个站点，或者发起第二次请求。

#### performance介绍

[window.performance](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/performance) 是W3C性能小组引入的新的API，目前IE9以上的浏览器都支持，主要分为三部分：

1. memory  代表JavaScript对内存的占用
2. navigation字段统计的是一些网页导航相关的数据
3. timing 字段包含了网络、解析等一系列的时间数据

![1551254845835](image\performance.png)

这里是timing的结构图，方便理解。

![img](image\timing.png)

这里我通过对API的统计分析，得出以下的指标：

> DNS查询耗时 ：domainLookupEnd - domainLookupStart
> 重定向耗时 ：redirectEnd - redirectStart
> 白屏耗时 responseStart - navigationStart
> 首屏耗时：domInteractive - .navigationStart
> TCP链接耗时：connectEnd - connectStart
> HTTP请求耗时：responseEnd - requestStart
> DOM结构解析完成耗时：domInteractive - domLoading
> 用户可交互时间：domContentLoadedEventEnd - navigationStart
> 页面完全加载耗时：loadEventEnd - navigationStart

## 5.开发

编写了一个performance.js，在页面中引入，然后就可以在控制台中看到性能的一些数据，由于IE浏览器不支持console.table()，显示的效果仍然是console.log()形式。performance.js代码如下：

```javascript
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
})();

```

## 6.测试

用一个简单的demo分别在chrome71版本和Firefox65版本进行了测试，结果如下：

**谷歌71：**

![](image\chrome_1.png)

具体指标：

![1551334073010](image\chrome_2.png)



Firefox65：

![1551334267922](image\firefox_1.png)

具体指标：

![1551334303223](image\firefox_2.png)

## 7.推广

使用performanceAPI，再搭配chrome浏览器本身的一些性能调节（network等），可以让我们在开发阶段就知道前端页面的性能如何，哪部分耗费时间较多，以便修改，并且可以使用中总结出，如何设计前端的资源加载和页面渲染能够提高性能，形成规范化的文档，有利于以后的项目开发。