/**
 * @package		CeraBox
 *
 * @author 		Sven
 * @since 		13-01-2011
 * @version 	1.3.3
 *
 * This package requires
 * - MooTools 1.4 >
 * - MooTools More Assets
 *
 * @license The MIT License
 *
 * Copyright (c) 2011-2012 Ceramedia, <http://ceramedia.net/>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var CeraBox = CeraBox || new Class({

	version: '1.3.3',

	Implements: [Options],

	boxWindow: null,
	
	collection: [],
	currentItem: 0,

	options: {
		ajax:			            null,
		group:			            true,
		width:			            null,
		height:			            null,
		displayTitle:	            true,
		fullSize:		            false, // Does not effect mobile view
		displayOverlay:	            true, // Does not effect mobile view
		clickToClose:	            false,
		loaderAtItem:               false,
		animation:		            'fade',
		errorLoadingMessage:	    'The requested content cannot be loaded or might not be supported. Please try again later.',
		titleFormat:                'Item {number} / {total} {title}',
		addContentProtectionLayer:  false,
		mobileView:                 Browser.Platform.ios || Browser.Platform.android || Browser.Platform.webos,
		fixedPosition:              false,
		clickToCloseOverlay:        true,
		events: {
			onOpen:			function(currentItem, collection){},
			onChange:		function(currentItem, collection){},
			onClose:		function(currentItem, collection){},
			onAnimationEnd: function(currentItem, collection){}
		}
	},

	/**
	 * Initialization add items to the box
	 *
	 * @param elements collection
	 * @param options {
	 * 		ajax:			            {},
	 * 		group:			            bool,
	 * 		width:			            int,
	 * 		height:			            int,
	 * 		displayTitle:	            bool,
	 * 		fullSize:		            bool,
	 * 		displayOverlay:	            bool,
	 * 		clickToClose:	            bool,
	 * 	    loaderAtItem:               bool,
	 * 		animation:		            'fade'|'ease',
	 * 	    errorLoadingMessage:	    string,
	 * 	    titleFormat:	            string,
	 *	    addContentProtectionLayer:  bool,
	 *      mobileView:                 bool,
	 * 		events: {
	 * 			onOpen:			function(currentItem, collection){},
	 * 			onChange:		function(currentItem, collection){},
	 * 			onClose:		function(currentItem, collection){},
	 * 		    onAnimationEnd: function(currentItem, collection){}
	 * 		}
	 * }
	 */
	initialize: function(elements, options) {
		this.boxWindow = CeraBoxWindow;

		elements = $$(elements);
		
		if (options && typeOf(options.group)!='null' && options.group===false && elements.length>1) {
			elements.each(function(item){
				item.store('cerabox', new CeraBox(item, options));
			});
		}

		//set options
		this.setOptions(options);

		// Handle the passed elements
		elements.each(function(item, index) {

			// Add to collection
			this.collection[index] = item;
			// Force handling type
			var type = item.dataset ? // dataset supported
				(typeOf(item.dataset.type)=='string' && item.dataset.type.trim()!='' ? item.dataset.type.trim() : null) :
				(item.get('data-type') && item.get('data-type').trim()!='' ? item.get('data-type').trim() : null);
			
			if ((null!==this.options.ajax && type===null) || type=='ajax') {
				item.addEvent('click', function(event){
					if (this._itemClick(event)) {
						this.currentItem = index;
						this.showAjax();
						return true;
					}
					return false;
				}.bind(this));
			}
			else if ((item.get('href').test(/^#/i) && type===null) || type=='inline') {
				item.addEvent('click', function(event){
					if (this._itemClick(event)) {
						this.currentItem = index;
						this.showInline();
						return true;
					}
					return false;
				}.bind(this));
			}
			else if ((item.get('href').test(/\.(jpg|jpeg|png|gif|bmp)(.*)?$/i) && type===null) || type=='image') {
				item.addEvent('click', function(event){
					if (this._itemClick(event)) {
						this.currentItem = index;
						this.showImage();
						return true;
					}
					return false;
				}.bind(this));
			}
			else if ((item.get('href').test(/\.(swf)(.*)?$/i) && type===null) || type=='swf') {
				item.addEvent('click', function(event){
					if (this._itemClick(event)) {
						this.currentItem = index;
						this.showSwf();
						return true;
					}
					return false;
				}.bind(this));
			}
			else {
				if (type!==null && type!='iframe') {
					throw 'Unknown type in dataset: ' + type;
				}

				item.addEvent('click', function(event){
					if (this._itemClick(event)) {
						this.currentItem = index;
						this.showIframe();
						return true;
					}
					return false;
				}.bind(this));
			}
		}.bind(this));
	},

	/**
	 * Display AJAX item
	 */
	showAjax: function() {

		var ceraBox = this,
			currentItem = ceraBox.collection[ceraBox.currentItem],
			requestEr = new Request.HTML({
				url: currentItem.get('href'),
				method: ceraBox.options.ajax.method?ceraBox.options.ajax.method:'post',
				data: ceraBox.options.ajax.data?ceraBox.options.ajax.data:'',
				evalScripts: ceraBox.options.ajax.evalScripts?ceraBox.options.ajax.evalScripts:false,

				onSuccess: function(responseTree, responseElements, responseHTML, responseJavaScript) {

					if (false===ceraBox.boxWindow.getBusy())
						return;
					
					// pre load images
					var assets = [];
					Array.each(responseElements, function(ele){
						if(ele.get('tag')=='img' && ele.get('src')) {
							assets.append([ele.get('src')]);
						}
					});

					var assetsLoaded = function(){
						var ajaxEle = ceraBox.boxWindow.preLoadElement(responseTree);

						ajaxEle.setStyle('width', ceraBox.options.width?ceraBox.options.width:ajaxEle.getScrollSize().x + 'px');
						ajaxEle.setStyle('height', ceraBox.options.height?ceraBox.options.height:ajaxEle.getScrollSize().y + 'px');

						var dimension = ceraBox.boxWindow.getSizeElement(ajaxEle);

						ajaxEle = ajaxEle.get('html');

						ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
							.addEvent('complete', function(){
								this.removeEvents('complete');

								if (false===ceraBox.boxWindow.getBusy())
									return;

								if (false!==ceraBox.options.displayTitle)
									ceraBox.boxWindow.displayTitle((currentItem.get('title')?currentItem.get('title'):''), ceraBox.currentItem+1, ceraBox.collection.length);

								ceraBox.boxWindow.setContent(new Element('div', {'html':ajaxEle}))
									.openWindow();
								// Run script from response
								(function(){eval(responseJavaScript)}).call(ceraBox);
							});
					}

					if (assets.length)
						Asset.images(assets, {
							onComplete: assetsLoaded
						});
					else
						assetsLoaded();
				},
				onerror: ceraBox._timedOut.bind(ceraBox),
				onTimeout: ceraBox._timedOut.bind(ceraBox),
				onFailure: ceraBox._timedOut.bind(ceraBox),
				onException: ceraBox._timedOut.bind(ceraBox)
			}).send();
	},

	/**
	 * Display Inline item
	 */
	showInline: function() {

		var ceraBox = this,
			currentItem = ceraBox.collection[ceraBox.currentItem],
			inlineEle   = (currentItem.get('href').test(/^#\$/i) && typeOf(window[currentItem.get('href').replace(/^#\$/i,'')])!='null')
							? ((typeOf(window[currentItem.get('href').replace(/^#\$/i,'')])!='element') ? new Element('div',{'html':window[currentItem.get('href').replace(/^#\$/i,'')]}) : window[currentItem.get('href').replace(/^#\$/i,'')])
							: (document.id(document.body).getElement(currentItem.get('href')) ? document.id(document.body).getElement(currentItem.get('href')).clone() : null);
		
		if (null!==inlineEle) {

			// pre load images
			var assets = [];
			Array.each(inlineEle.getElements('img'), function(ele){
				if(ele.get('src')) {
					assets.append([ele.get('src')]);
				}
			});
			
			var assetsLoaded = function(){
				var inlineEleClone = ceraBox.boxWindow.preLoadElement(inlineEle.clone());

				inlineEleClone.setStyle('width', ceraBox.options.width?ceraBox.options.width:inlineEleClone.getScrollSize().x + 'px');
				inlineEleClone.setStyle('height', ceraBox.options.height?ceraBox.options.height:inlineEleClone.getSize().y + 'px');

				var dimension = ceraBox.boxWindow.getSizeElement(inlineEleClone);

				ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
					.addEvent('complete', function(){
						this.removeEvents('complete');

						if (false===ceraBox.boxWindow.getBusy())
							return;

						if (false!==ceraBox.options.displayTitle)
							ceraBox.boxWindow.displayTitle((currentItem.get('title')?currentItem.get('title'):''), ceraBox.currentItem+1, ceraBox.collection.length);

						ceraBox.boxWindow.setContent(inlineEle)
							.openWindow();
					});
			}

			if (assets.length)
				Asset.images(assets, {
					onComplete: assetsLoaded
				});
			else
				assetsLoaded();

		}
		else {
			ceraBox._timedOut();
		}
	},

	/**
	 * Display image item
	 */
	showImage: function() {
		var ceraBox = this,
			currentItem = ceraBox.collection[ceraBox.currentItem],
			image = new Asset.image(currentItem.get('href'), {
				'class': 'image',
				onload: function() {

					if (false===ceraBox.boxWindow.getBusy())
						return;
					
					this.set('width', ceraBox.options.width?ceraBox.options.width:this.get('width'));
					this.set('height', ceraBox.options.height?ceraBox.options.height:this.get('height'));

					var dimension = ceraBox.boxWindow.getSizeElement(this);

					ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
						.addEvent('complete', function(){
							this.removeEvents('complete');

							if (false===ceraBox.boxWindow.getBusy())
								return;

							if (false!==ceraBox.options.displayTitle)
								ceraBox.boxWindow.displayTitle((currentItem.get('title')?currentItem.get('title'):''), ceraBox.currentItem+1, ceraBox.collection.length);

							ceraBox.boxWindow.setContent(image)
								.openWindow();
						});
				},
				onerror: ceraBox._timedOut.bind(ceraBox)
			});
	},

	/**
	 * Display swf item
	 */
	showSwf: function() {
		// No flash
		if (Browser.Plugins.Flash.version==0) {
			this._timedOut();
			return;
		}

		var ceraBox = this,
			currentItem = ceraBox.collection[ceraBox.currentItem],
			dimension = {
				width:ceraBox.options.width?ceraBox.options.width:500,
				height:ceraBox.options.height?ceraBox.options.height:400
			},
			swfEr = new Swiff(currentItem.get('href'), {
				width: dimension.width,
				height: dimension.height,
				params: {
					wMode: 'opaque'
				}
			});

		ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
			.addEvent('complete', function(){
				this.removeEvents('complete');

				if (false===ceraBox.boxWindow.getBusy())
					return;

				if (false!==ceraBox.options.displayTitle)
					ceraBox.boxWindow.displayTitle((currentItem.get('title')?currentItem.get('title'):''), ceraBox.currentItem+1, ceraBox.collection.length);

				ceraBox.boxWindow.setContent(swfEr)
					.openWindow();
			});
	},

	/**
	 * Display iframe item
	 */
	showIframe: function() {

		// Set timeout timer incase request cannot be done
		this.boxWindow.setTimeOuter(this._timedOut.delay(10000, this));

		var ceraBox = this,
			currentItem = ceraBox.collection[ceraBox.currentItem],
			ceraIframe = new IFrame({
				src: currentItem.get('href'),
				'class': 'iframe',
				styles: {
					width: 1,
					height: 1,
					border: '0px'
				},

				events: {
					load: function() {

						if (false===ceraBox.boxWindow.getBusy() && !ceraBox.boxWindow.getWindowOpen())
							return;

						this.setStyles({
							width: ceraBox.options.width?ceraBox.options.width:'1px',
							height: ceraBox.options.height?ceraBox.options.height:'1px',
							border: 0
						});
						
						var dimension = ceraBox.boxWindow.getSizeElement(this);

						ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
							.addEvent('complete', function(){
								this.removeEvents('complete');

								if (false===ceraBox.boxWindow.getBusy() && !ceraBox.boxWindow.getWindowOpen())
									return;
								
								//if (false!==ceraBox.options.displayTitle)
									//ceraBox.boxWindow.displayTitle((currentItem.get('title')?currentItem.get('title'):''), ceraBox.currentItem+1, ceraBox.collection.length);

								ceraBox.boxWindow.openWindow();
							});
					}
				}
			});

		ceraIframe.set('border',0);
		ceraIframe.set('frameborder',0);

		this.boxWindow.setContent(ceraIframe);
	},

	/**
	 * Has timed out display error
	 */
	_timedOut: function() {

		var ceraBox = this,
			errorEle = new Element('span',{'class':'cerabox-error','html':ceraBox.options.errorLoadingMessage});

		var errorEleClone = ceraBox.boxWindow.preLoadElement(errorEle.clone());

		errorEleClone.setStyles({
			'width': '270px',
			'height': errorEleClone.getSize().y + 'px'
		});

		if (this.options.mobileView)
			errorEle.setStyles({
				'position': 'absolute',
				'top': '50%',
				'margin-top': -Math.round(errorEleClone.getSize().y/2) + 'px'
			});

		var dimension = ceraBox.boxWindow.getSizeElement(errorEleClone, true);

		ceraBox.boxWindow.onLoad(dimension.width, dimension.height)
			.addEvent('complete', function(){
				this.removeEvents('complete');

				if (false===ceraBox.boxWindow.getBusy())
					return;

				ceraBox.boxWindow.hideTitle();

				ceraBox.boxWindow.setContent(errorEle)
					.openWindow();
			});
	},

	// Default stuff to do when item clicked
	_itemClick: function(event) {
		if (event)
			event.preventDefault();

		if (this.boxWindow.getBusy())
			return false;

		this.boxWindow.loading(this);

		return true;
	},




	/**
	 * Simple logging function
	 */
	_log: function(log, alertIt) {
		try {
			console.log(log);
		}
		catch(err) {
			if (alertIt)
				alert(log);
		}
	}



});



// View
var CeraBoxWindow = (function(window) {

	var busy                = false,
		lock                = false,
		loaderTimer         = null,
		timeOuter           = null,
		windowOpen          = false,
		currentInstance     = null,
		currentDimension    = {x:0, y:0},
		hudTimer            = null,

		// Touch
		startPos            = {x:null, y:null},
		endPos              = {x:null, y:null},

		viewport            = {x:0, y:0},
		cerabox             = null;

	var boxWindow = new Class({

		initialize: function() {
			window.addEvent('domready', function(){
				// Add html
				initHTML();

				this.updateWindow();

				// Terminate loading
				document.id('cerabox-loading').addEvent('click', function(event){
					event.stop();
					this.close(true);
				}.bind(this));

				// Keyboard controls
				document.addEvent('keyup', function(event) {
					if (event.key == 'esc')
						this.close();
					if (event.target.get('tag')=='input' || event.target.get('tag')=='select' || event.target.get('tag')=='textarea')
						return;
					if (event.key == 'left')
						cerabox.getElement('.cerabox-left').fireEvent('click', event);
					if (event.key == 'right')
						cerabox.getElement('.cerabox-right').fireEvent('click', event);
				}.bind(this));

				// Touch controls
				cerabox.addEvent('touchstart',     touchStart);
				cerabox.addEvent('touchmove',      touchMove);
				cerabox.addEvent('touchend',       touchEnd);
				cerabox.addEvent('touchcancel',    touchCancel);
				// No movement on the loader
				document.id('cerabox-loading').addEvent('touchmove',function(event){event.stop()});
			}.bind(this));

			window.addEvent('resize', this.updateWindow.bind(this));
			window.addEvent('scroll', this.updateWindow.bind(this, 'scroll'));
			window.addEvent('orientationchange', this.updateWindow.bind(this));
		},

		updateWindow: function(type) {
			this.setViewport();
			
			// Window not open no need to update further
			if (!windowOpen || null===currentInstance || busy || (type=='scroll' && !currentInstance.options.mobileView)) {
				return;
			}

			busy = true;

			if (false!==currentInstance.options.displayOverlay || currentInstance.options.mobileView) {
				displayOverlay();
			}

			transformItem()
				.addEvent('complete', function(){
					this.removeEvents('complete');
					showHud();
					busy = false;
				});
		},

		close: function(terminate) {
			if ((busy && !terminate) || lock || !currentInstance)
				return;

			busy = !terminate;
			
			clearInterval(timeOuter);
			clearInterval(loaderTimer);
			clearInterval(hudTimer);
			document.id('cerabox-loading').setStyle('display', 'none');

			if (currentInstance.options.mobileView) {
				document.id('cerabox-background').setStyles({
					'display':'none',
					'width': 0,
					'height': 0,
					'opacity': 0
				});

				cerabox.setStyles({
					'display':'none'
				});
				cerabox.getElement('.cerabox-content').empty().setStyle('opacity',0);
				cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
				cerabox.getElement('.cerabox-right').removeEvents('click').setStyle('display','none');
				this.hideTitle();

				if (windowOpen){
					currentInstance.options.events.onClose.call(
						currentInstance,
						currentInstance.collection[currentInstance.currentItem],
						currentInstance.collection
					);
				}

				currentInstance = null;
				windowOpen = false;
				busy = false;
			}
			else {

				cerabox.set('tween', {duration: 50}).tween('opacity', 0).get('tween')
					.addEvent('complete', function() {
						this.removeEvents('complete');

						document.id('cerabox-background').set('tween', {duration: 50,link:'chain'}).tween('opacity',0).tween('display','none')
							.get('tween')
							.addEvent('chainComplete', function() {
								this.removeEvents('chainComplete');

								cerabox.setStyles({
									'display':'none'
								});
								cerabox.getElement('.cerabox-content').empty().setStyle('opacity', 0);
								cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
								cerabox.getElement('.cerabox-right').removeEvents('click').setStyle('display','none');
								_instance.hideTitle();

								if (windowOpen){
									currentInstance.options.events.onClose.call(
										currentInstance,
										currentInstance.collection[currentInstance.currentItem],
										currentInstance.collection
									);
								}

								currentInstance = null;
								windowOpen = false;
								busy = false;
							});
					});
			}
		},

		/**
		 * Set content with element
		 * @param element
		 * @return CeraBoxWindow
		 */
		setContent: function(element) {
			cerabox.getElement('.cerabox-content')
				.empty()
				//.setStyle('opacity',0)
				.adopt(element);
			return this;
		},

		/**
		 * Set current cerabox and ready window
		 * @param instance CeraBox
		 * @return CeraBoxWindow
		 */
		loading: function(instance) {
			if (!instanceOf(instance, CeraBox))
				throw 'Instance should be an instance of CeraBox';

			this.setViewport();

			currentInstance = instance;

			busy = true;
			// Protection
			cerabox.getElement('.cerabox-content-protection').setStyle('display','none');
			if (true===currentInstance.options.addContentProtectionLayer)
				cerabox.getElement('.cerabox-content-protection').setStyle('display','block');
			// Click to close
			cerabox.setStyle('cursor','auto').removeEvents('click');
			if (true===currentInstance.options.clickToClose)
				cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));

			// Make sure it doesn't time out when started a new request and prev loader is gone
			clearInterval(timeOuter);
			clearInterval(loaderTimer);
			document.id('cerabox-loading').setStyle('display', 'none');

			loaderTimer = displayLoader.delay(200);

			// Mobile view
			cerabox.removeClass('mobile');
			if (currentInstance.options.mobileView) {
				cerabox.addClass('mobile');
			}

			return this;
		},

		/**
		 * Adopt element to preloading element
		 * @param element
		 * @return element preloaded element
		 */
		preLoadElement: function(element) {
			cerabox.setStyle('display','block');
			return cerabox.getElement('#cerabox-ajaxPreLoader').empty().adopt(element);
		},

		/**
		 * Ready the window for new content
		 * @param width
		 * @param height
		 * @return tween
		 */
		onLoad: function(width, height) {
			// Lock window
			lock = true;

			clearInterval(timeOuter);
			clearInterval(loaderTimer);

			if (false!==currentInstance.options.displayOverlay || currentInstance.options.mobileView) {
				displayOverlay();
			}

			// Clear preloader
			cerabox.getElement('#cerabox-ajaxPreLoader').empty().setStyles({'width':'auto','height':'auto'});

			currentDimension = {
				x: width,
				y: height
			};
			
			return cerabox.getElement('.cerabox-content').set('tween', {duration: currentInstance.options.mobileView?0:300})
					.tween('opacity', (windowOpen && cerabox.getElement('.cerabox-content iframe')?1:0))
					.get('tween');
		},

		/**
		 * Open cerabox window
		 * @param width
		 * @param height
		 */
		openWindow: function(width, height) {

			// Hide loader
			document.id('cerabox-loading').setStyle('display', 'none');

			width = currentDimension.x = width || currentDimension.x;
			height = currentDimension.y = height || currentDimension.y;

			var currentItem = currentInstance.collection[currentInstance.currentItem];

			showHud();

			if (windowOpen) {
				transformItem(width, height);

				if (currentInstance.options.mobileView) {

					cerabox.getElement('.cerabox-content').setStyle('opacity',1);

					// unlock window
					lock = false;

					busy = false;

					addNavButtons();

					// onChange event
					currentInstance.options.events.onChange.call(currentInstance, currentItem, currentInstance.collection);
				}
				else {
					cerabox.getElement('.cerabox-content')
						.set('tween', {duration: cerabox.getElement('.cerabox-content iframe')?0:200}).tween('opacity',1)
						.get('tween')
						.addEvent('complete', function(){
							this.removeEvents('complete');

							// unlock window
							lock = false;

							busy = false;

							addNavButtons();

							// onChange event
							currentInstance.options.events.onChange.call(currentInstance, currentItem, currentInstance.collection);
						});
				}
				return;
			}

			if (!currentInstance.options.mobileView)
				cerabox.getElement('.cerabox-content').setStyle('opacity', 1);

			// onOpen event
			currentInstance.options.events.onOpen.call(currentInstance, currentItem, currentInstance.collection);

			transformItem(width, height).addEvent('complete', function(){
				this.removeEvents('complete');

				// If mobile view display content when window is rdy
				if (currentInstance.options.mobileView)
					cerabox.getElement('.cerabox-content').setStyle('opacity', 1);

				// unlock window
				lock = false;

				busy = false;

				addNavButtons();

				// onChange event
				currentInstance.options.events.onAnimationEnd.call(currentInstance, currentItem, currentInstance.collection);
			});

			currentItem.blur();
			windowOpen = true;
		},

		/**
		 * Display title
		 * @param text string
		 * @param number int
		 * @param total int
		 * @return CeraBoxWindow
		 */
		displayTitle: function(text, number, total) {

			if (total>1) {
				text = currentInstance.options.titleFormat.substitute({
					'number': number,
					'total': total,
					'title': text
				});
			}
			// Set text if passed else only set display
			if (text)
				cerabox.getElement('.cerabox-title span').setStyle('display','block').set('text', text);
			else
				cerabox.getElement('.cerabox-title span').setStyle('display','block');

			return this;
		},

		/**
		 * Hide title
		 * @return CeraBoxWindow
		 */
		hideTitle: function() {
			cerabox.getElement('.cerabox-title span')
				.setStyle('display','none');
			return this;
		},

		/**
		 * Set viewport
		 * @return CeraBoxWindow
		 */
		setViewport: function() {
			viewport = {
				x: (window.innerWidth?window.innerWidth:window.getSize().x),
				y: (window.innerHeight?window.innerHeight:window.getSize().y)
			};
			return this;
		},

		/**
		 * Getter viewport
		 */
		getViewport: function() {
			return viewport;
		},

		/**
		 * Getter currentInstance
		 * @return CeraBox
		 */
		getCurrentInstance: function() {
			return currentInstance;
		},

		/**
		 * Getter busy - lol
		 * @return bool
		 */
		getBusy: function() {
			return busy;
		},

		/**
		 * Getter windowOpen
		 * @return bool
		 */
		getWindowOpen: function() {
			return windowOpen;
		},

		/**
		 * Set timeOuter
		 * @param timer
		 * @return CeraBoxWindow
		 */
		setTimeOuter: function(timer) {
			timeOuter = timer;
			return this;
		},

		/**
		 * Get size element object
		 *
		 * @param element
		 * @return object
		 */
		getSizeElement: function(element, forceFullSize) {
			var eleWidth = 0, eleHeight = 0;

			if (element.get('tag')=='iframe') {
				cerabox.setStyle('display','block');
				try {
					eleWidth = (element.get('width')?sizeStringToInt(element.get('width'),'x'):(element.getStyle('width').toInt()>1?sizeStringToInt(element.getStyle('width'),'x'):
						(element.contentWindow.document.getScrollSize().x?element.contentWindow.document.getScrollSize().x:viewport.x * 0.75)));
				}
				catch(err) {
					eleWidth = viewport.x * 0.75;
				}

				try {
					eleHeight = (element.get('height')?sizeStringToInt(element.get('height'),'y'):(element.getStyle('height').toInt()>1?sizeStringToInt(element.getStyle('height'),'y'):
						(element.contentWindow.document.getScrollSize().y?element.contentWindow.document.getScrollSize().y:viewport.y * 0.75)));
				}
				catch(err) {
					eleHeight = viewport.y * 0.75;
				}

				if (Browser.ie) {
					eleHeight = eleHeight + 20;
				}

				if (!forceFullSize && false===currentInstance.options.fullSize) {
					if ((viewport.y - 100)<eleHeight) {
						eleWidth = eleWidth + (Browser.Platform.mac?15:17);
					}
					return {width: (viewport.x - 50)<eleWidth?(viewport.x - 50):eleWidth, height: (viewport.y - 100)<eleHeight?(viewport.y - 100):eleHeight};
				}
				else {
					return {width: eleWidth, height: eleHeight};
				}
			}

			eleWidth = (element.get('width')?sizeStringToInt(element.get('width'),'x'):(element.getStyle('width')&&element.getStyle('width')!='auto'?sizeStringToInt(element.getStyle('width'),'x'):viewport.x - 50));
			eleHeight = (element.get('height')?sizeStringToInt(element.get('height'),'y'):(element.getStyle('height')&&element.getStyle('height')!='auto'?sizeStringToInt(element.getStyle('height'),'y'):viewport.y - 100));

			if (!forceFullSize && false===currentInstance.options.fullSize) {
				var r = Math.min(Math.min(viewport.x - 50, eleWidth) / eleWidth, Math.min(viewport.y - 100, eleHeight) / eleHeight);
				return {width: Math.round(r * eleWidth), height: Math.round(r * eleHeight)};
			}
			else
				return {width: eleWidth, height: eleHeight};
		}
	}),
	_instance = new boxWindow();

	

	/**
	 * Private methods
	 * --------------------
	 */


	/**
	 * Add navigation buttons for group items
	 */
	function addNavButtons() {
		cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
		cerabox.getElement('.cerabox-right').removeEvents('click').setStyle('display','none');

		if (currentInstance.collection[currentInstance.currentItem-1]) {
			cerabox.getElement('.cerabox-left').setStyle('display','block').addEvent('click', function(event){
				event.stopPropagation();
				if (!busy) {
					this.setStyle('display','none').removeEvents('click');
					currentInstance.collection[currentInstance.currentItem-1].fireEvent('click', event);
				}
			});
		}
		if (currentInstance.collection[currentInstance.currentItem+1]) {
			cerabox.getElement('.cerabox-right').setStyle('display','block').addEvent('click', function(event){
				event.stopPropagation();
				if (!busy) {
					this.setStyle('display','none').removeEvents('click');
					currentInstance.collection[currentInstance.currentItem+1].fireEvent('click', event);
				}
			});
		}
	}

	/**
	 * Transform item to an other size
	 *
	 * @param width int
	 * @param height int
	 * @return morph|tween
	 */
	function transformItem(width, height) {

		width = width || currentDimension.x;
		height = height || currentDimension.y;

		// Clear title
		if (!currentInstance.options.displayTitle || cerabox.getElement('.cerabox-content iframe')) {
			_instance.hideTitle();
		}
		
		if (currentInstance.options.mobileView) {
			document.id(document.body).setStyle('overflow','hidden');

			var landscape = Math.abs(window.orientation) == 90,
				screenWidth = landscape ? screen.height : screen.width,
				scaledWidth,
				scaledHeight,
				scale,
				screenScale;

			if (cerabox.getElement('.cerabox-content iframe')) {

				scaledWidth = viewport.x,
				scaledHeight = viewport.y,
				scale = (scaledHeight < (height * scaledWidth / width)? scaledHeight / height : scaledWidth / width),
				screenScale = 1;
				
				cerabox.getElements('.cerabox-close, .cerabox-left, .cerabox-right, .cerabox-title').setStyles({
					'-webkit-transform': 'scale(' + (viewport.x / screenWidth) + ')',
					'transform': 'scale(' + (viewport.x / screenWidth) + ')'
				});
			}
			else {
				if (!cerabox.getElement('.cerabox-content img')) {
					width = Math.round(viewport.x * (screenWidth / viewport.x));
					height = Math.round(viewport.y * (screenWidth / viewport.x));
				}
				scaledWidth = Math.round(viewport.x * (screenWidth / viewport.x)),
				scaledHeight = Math.round(viewport.y * (screenWidth / viewport.x)),
				scale = (scaledHeight < (height * scaledWidth / width)? scaledHeight / height : scaledWidth / width),
				screenScale = (viewport.x / screenWidth);

				cerabox.getElements('.cerabox-close, .cerabox-left, .cerabox-right, .cerabox-title').setStyles({
					'-webkit-transform': 'scale(1)',
					'transform': 'scale(1)'
				});
			}

			cerabox.setStyles({
				'position': 'absolute',
				'display':'block',
				'width':scaledWidth + 'px',
				'height':scaledHeight + 'px',
				'opacity':1,
				'left': document.id(document.body).getScroll().x,
				'right': 0,
				'top': document.id(document.body).getScroll().y,
				'bottom': 0,
				'margin': 0,
				'-webkit-transform': 'scale(' + (screenScale) + ')',
				'transform': 'scale(' + (screenScale) + ')'
			});
			cerabox.getElement('.cerabox-content').setStyles({
				'width': Math.round(width * scale),
				'height': Math.round(height * scale),
				'left': ((scaledWidth - Math.round(width * scale))/2),
				'top': ((scaledHeight - Math.round(height * scale))/2)
			});

			if (cerabox.getElement('.cerabox-content iframe'))
				cerabox.getElement('.cerabox-content iframe').setStyles({'width':Math.round(width * scale),'height':Math.round(height * scale)});

			return cerabox.set('tween', {duration: 0}).tween('opacity',1).get('tween');
		}
		else {

			if (cerabox.getElement('.cerabox-content iframe'))
				cerabox.getElement('.cerabox-content iframe').setStyles({'width':width,'height':height});

			var morphObject = {
				'display':'block',
				'width':width,
				'height':height,
				'opacity':1,
				'-webkit-transform': 'scale(1)',
				'transform': 'scale(1)'
			};

			cerabox.setStyles({
				'position': (currentInstance.options.fixedPosition?'fixed':'absolute'),
				'top':Math.round((viewport.y/2)) + 'px',
				'left':Math.round((viewport.x/2)) + 'px',
				'right':'auto',
				'bottom':'auto'
			});

			if (/*viewport.x > cerabox.getSize().x+40 &&*/ viewport.x > width+60) {
				morphObject['margin-left'] = Math.round((-width/2) + (!currentInstance.options.fixedPosition?document.id(document.body).getScroll().x:0)) + 'px';
			}
			else {
				morphObject['margin-left'] = Math.round(((viewport.x/2)-width-40) + (!currentInstance.options.fixedPosition?document.id(document.body).getScroll().x:0)) + 'px';
			}

			if (/*viewport.y > cerabox.getSize().y+40 &&*/ viewport.y > height+40) {
				morphObject['margin-top'] = Math.round((-height/2) + (!currentInstance.options.fixedPosition?document.id(document.body).getScroll().y:0)) + 'px';
			}
			else {
				morphObject['margin-top'] = Math.round((-viewport.y/2+20) + (!currentInstance.options.fixedPosition?document.id(document.body).getScroll().y:0)) + 'px';
			}

			// Reset from mobile if needed
			cerabox.getElement('.cerabox-content').setStyles({
				'width': '100%',
				'height': '100%',
				'left': 0,
				'top': 0
			});

			if (!windowOpen) {
				switch (currentInstance.options.animation) {
				case 'ease':
					var currentItem = currentInstance.collection[currentInstance.currentItem];
					Object.append(morphObject, {
						'top':cerabox.getStyle('top'),
						'left':cerabox.getStyle('left')
					});
					return cerabox.setStyles({
								'display':'block',
								'left':(currentItem.getPosition().x - (currentInstance.options.fixedPosition?document.id(document.body).getScroll().x:0)) + 'px',
								'top':(currentItem.getPosition().y - (currentInstance.options.fixedPosition?document.id(document.body).getScroll().y:0)) + 'px',
								'width':currentItem.getSize().x + 'px',
								'height':currentItem.getSize().y + 'px',
								'margin':0,
								'opacity':0
							}).set('morph', {duration: 200}).morph(morphObject).get('morph');
					break;
				case 'fade':
				default:
					Object.append(morphObject, {
						'opacity':0
					});

					return cerabox.setStyles(morphObject).set('tween', {duration: 200}).tween('opacity', 1).get('tween');
					break;
				}
			}
			else {
				return cerabox.set('morph', {duration: 150}).morph(morphObject).get('morph');
			}
		}
	}

	/**
	 * Display overlay
	 */
	function displayOverlay() {
		var styles = {
			'display':  'block',
			'opacity':  currentInstance.options.mobileView?1:.5,
			'top':      0,
			'left':     0,
			'height':   '100%',
			'width':    '100%',
			'position': 'fixed'
		};

		// iOS does not support position fixed
		if (currentInstance.options.mobileView) {
			Object.merge(styles, {
				'top': 0,
				'left': 0,
				'width':  (document.id(document.body).getScrollSize().x) + 'px',
				'height': (document.id(document.body).getScrollSize().y) + 'px',
				'position': 'absolute'
			});
		}

		document.id('cerabox-background').setStyles(styles);
	}

	/**
	 * Display loading spinner
	 */
	function displayLoader() {
		var styles = {
			'position': 'fixed',
			'display': 'block',
			'top': '50%',
			'left': '50%',
			'margin-top': '-20px',
			'margin-left': '-20px',
			'-webkit-transform': 'scale(1)',
			'transform': 'scale(1)'
		};

		// loaderAtItem
		if (true===currentInstance.options.loaderAtItem && !windowOpen) {
			var currentItem = currentInstance.collection[currentInstance.currentItem];
			Object.append(styles, {
				'position': 'absolute',
				'top': Math.round(((currentItem.getSize().y/2) - (document.id('cerabox-loading').getStyle('height').toInt()/2)) + currentItem.getPosition().y) + 'px',
				'left': Math.round(((currentItem.getSize().x/2) - (document.id('cerabox-loading').getStyle('width').toInt()/2)) + currentItem.getPosition().x) + 'px',
				'margin-top': 0,
				'margin-left': 0
			});
		}
		else {
			if (currentInstance.options.mobileView) {
				var landscape = Math.abs(window.orientation) == 90,
					screenWidth = landscape ? screen.height : screen.width;
				// Scale loader
				Object.append(styles, {
					'position': 'absolute',
					'top': Math.round(((viewport.y/2) - (document.id('cerabox-loading').getStyle('height').toInt()/2)) + document.id(document.body).getScroll().y) + 'px',
					'left': Math.round(((viewport.x/2) - (document.id('cerabox-loading').getStyle('width').toInt()/2)) + document.id(document.body).getScroll().x) + 'px',
					'margin-top': 0,
					'margin-left': 0,
					'-webkit-transform': 'scale(' + (viewport.x / screenWidth) + ')',
					'transform': 'scale(' + (viewport.x / screenWidth) + ')'
				});
			}
		}

		document.id('cerabox-loading').setStyles(styles);
		loaderAnimation();
	}

	/**
	 * Loader animation
	 *
	 * @param frame int
	 */
	function loaderAnimation(frame) {
		if (!frame)
			frame=0;
		document.id('cerabox-loading').getElement('div').setStyle('top', (frame * -40) + 'px');
		frame = (frame + 1) % 12;

		if (document.id('cerabox-loading').getStyle('display')!='none')
			loaderAnimation.delay(60, this, frame);
	}

	/**
	 * Get the pixels of given element size
	 *
	 * @param size string
	 * @param dimension 'x'|'y'
	 */
	function sizeStringToInt(size, dimension) {
		return (typeOf(size)=='string' && size.test('%')?viewport[dimension]*(size.toInt()/100):size.toInt());
	}

	/**
	 * Inject needed HTML to the body
	 */
	function initHTML() {
		var wrapper = document.id(document.body);

		if (!wrapper.getElement('#cerabox')) {
			wrapper.adopt([
				new Element('div',{'id':'cerabox-loading'}).adopt(new Element('div')),
				new Element('div',{'id':'cerabox-background', 'events':{'click':function(event){event.stop();if(currentInstance.options.clickToCloseOverlay)_instance.close()}}}),
				cerabox = new Element('div',{'id':'cerabox'}).adopt([
				                                    new Element('div', {'class':'cerabox-content'}),
				                                    new Element('div', {'class':'cerabox-title'}).adopt(new Element('span')),
				                                    new Element('a', {'class':'cerabox-close','events':{'click':function(event){event.stop();_instance.close()}}}),
				                                    new Element('a', {'class':'cerabox-left'}).adopt(new Element('span')),
				                                    new Element('a', {'class':'cerabox-right'}).adopt(new Element('span')),
													new Element('div', {'class':'cerabox-content-protection'}),
				                                    new Element('div', {'id':'cerabox-ajaxPreLoader', 'styles':{'float':'left','overflow':'hidden','display':'block'}})
				])
			]);
		}
	}

	/**
	 * Hide title and buttons
	 */
	function hideHud() {
		clearInterval(hudTimer);
		cerabox.getElements('.cerabox-title, .cerabox-close, .cerabox-left, .cerabox-right').set('tween', {duration: 500}).tween('opacity', 0);
	}

	/**
	 * Show title and buttons
	 */
	function showHud() {
		cerabox.getElements('.cerabox-title, .cerabox-close, .cerabox-left, .cerabox-right').setStyle('opacity',1);
		clearInterval(hudTimer);

		if (currentInstance.options.mobileView &&
			!currentInstance.options.clickToClose &&
			'createTouch' in document &&
			!cerabox.getElement('.cerabox-content iframe')
		) {
			hudTimer = hideHud.delay(5000);
		}
	}

	/**
	 * Touch events
	 */
	function touchStart(event) {
		startPos = endPos = event.client;
	}

	function touchMove(event) {
		endPos = event.client;
		event.preventDefault();
	}

	function touchEnd(event) {
		// Make sure it should only fire on end
		if (null!==startPos.x && null!==endPos.x) {
			var distance = getTouchDistance(),
				landscape = Math.abs(window.orientation) == 90,
				screenWidth = landscape ? screen.height : screen.width;
			// Far enough on scale
			if (50 <= Math.round(distance * (screenWidth / viewport.x))) {
				fireTouchEvent(event, getTouchAngle());
			}
			else {
				if (!distance) {
					if ( event.target.get('tag')!='a' &&
						 !event.target.getParent('.cerabox-close') &&
						 !event.target.getParent('.cerabox-left') &&
						 !event.target.getParent('.cerabox-right')
					) {
						cerabox.fireEvent('click', event);
						
						event.stop();
						if (cerabox.getElement('.cerabox-close').getStyle('opacity')!=1) {
							showHud();
						}
						else {
							hideHud();
						}
					}
				}
				touchCancel();
			}
		}
		else {
			touchCancel();
		}
	}

	function touchCancel() {
		startPos   = {x:null, y:null};
		endPos     = {x:null, y:null};
	}

	function getTouchDistance() {
		return Math.round(Math.sqrt(Math.pow(endPos.x - startPos.x,2) + Math.pow(endPos.y - startPos.y,2)));
	}

	function getTouchAngle() {
		var x = startPos.x - endPos.x;
		var y = endPos.y - startPos.y;
		var angle = Math.round(Math.atan2(y,x)*180/Math.PI);

		if (angle < 0)
            angle = 360 - Math.abs(angle);

		return angle;
	}

	function fireTouchEvent(event, angle) {
		if (angle>=315 || angle<=45) {
			cerabox.getElement('.cerabox-right').fireEvent('click', event);
		}
		else if (angle>=135 && angle<=225) {
			cerabox.getElement('.cerabox-left').fireEvent('click', event);
		}
		/*else if (angle>45 && angle<135) {
			$(this).fireEvent('swipeDown', [event, properties]);
		}
		else if (angle>225 && angle<315) {
			$(this).fireEvent('swipeUp', [event, properties]);
		}*/
		touchCancel();
	}

	return _instance;
})(window);




// Collection
Array.implement({
	cerabox: function(options){
		if (!options || typeOf(options.group)=='null' || options.group===true) {
			var box = new CeraBox(this, options);
			this.each(function(item){
				item.store('cerabox', box);
			});
		}
		else {
			this.each(function(item){
				item.store('cerabox', new CeraBox(item, options));
			});
		}
		return this;
	}
});

// Single element
Element.implement({
	cerabox: function(options){
		return this.store('cerabox', new CeraBox(this, options));
	}
});