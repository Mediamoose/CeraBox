/**
 * @package		CeraBox
 * 
 * @author 		Sven
 * @since 		13-01-2011
 * @version 	1.2.20
 * 
 * This package requires
 * - MooTools 1.3.2 >
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

var CeraBox = new Class({
	
	Implements: [Options],
	
	loaderTimer: null,
	timeOuter: null,
	
	vars : {
		items: new Array(),
		cerabox: null,
		windowOpen: false,
		busy: false,
		currentIndex: [0,0]
	},
	
	options: {
		group:					    true,
		errorLoadingMessage:	    'The requested content cannot be loaded. Please try again later.',
		addContentProtectionLayer:  false,
		events:	{
			onClose:	        function(){},
			onOpen:		        function(){},
			onChange:	        function(){},
			onAnimationEnd:     function(){},
			_onClose:	        null,
			_onOpen:	        null,
			_onChange:          null,
			_onAnimationEnd:    null
		}
	},
	
	//initialization
	initialize: function(options) {
		//set options
		this.setOptions(options);
		
		this.initHTML();
		
		if (Browser.ie6)
			document.id('cerabox-loading').addClass('ceraboxbox-ie6');
		
		window.addEvent('resize', this._resize.bind(this));
		
		document.id('cerabox-loading').addEvent('click', function(event){
			event.stop();
			this.close(true);
		}.bind(this));
		
		document.addEvent('keyup', function(event) {
			if (event.key == 'esc')
				this.close();
			if (event.target.get('tag')=='input' || event.target.get('tag')=='select' || event.target.get('tag')=='textarea')
				return;
			if (event.key == 'left')
				this.vars.cerabox.getElement('.cerabox-left').fireEvent('click', event);
			if (event.key == 'right')
				this.vars.cerabox.getElement('.cerabox-right').fireEvent('click', event);
		}.bind(this));
	},
	
	/**
	 * Add items to the box
	 * 
	 * @param mixed container
	 * @param object options {
	 * 		ajax:			{},
	 * 		group:			bool,
	 * 		width:			int,
	 * 		height:			int,
	 * 		displayTitle:	bool,
	 * 		fullSize:		bool,
	 * 		displayOverlay:	bool,
	 * 		clickToClose:	bool,
	 * 	    loaderAtItem:   bool,
	 * 		animation:		'fade'|'ease',
	 * 		events:			{
	 * 			onOpen:			function(currentItem, collection){},
	 * 			onChange:		function(currentItem, collection){},
	 * 			onClose:		function(currentItem, collection){},
	 * 		    onAnimationEnd: function(currentItem, collection){}
	 * 		}
	 * }
	 */
	addItems: function(container, options) {
		var items = $$(container);
		if (items.length<1)
			throw 'Empty container';
		
		var itemsIndex = this.vars.items.length;
		this.vars.items[itemsIndex] = [];
		
		options = options ? options : {};
		
		Array.each(items, function(item, index) {
			
			// Dont group selection
			if (options.group===false||(options.group!==true&&this.options.group===false)) {
				this.vars.items[itemsIndex] = [];
				this.vars.items[itemsIndex][0] = item;
				index 		= [itemsIndex,0];
				itemsIndex	= itemsIndex+1;
			}
			else {
				this.vars.items[itemsIndex][index] = item;
				index = [itemsIndex,index];
			}
			
			//this.vars.cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
			if (typeof options.ajax != 'undefined') {
				item.addEvent('click', function(event){
					if (event)
						event.preventDefault();
					if (this.vars.busy)
						return;
					this.vars.busy=true;
					// Add events
					this._addCallbacks((typeof options.events != 'undefined')?options.events:null);
					// Protection
					this.vars.cerabox.getElement('.cerabox-content-protection').setStyle('display','none');
					// Click to close
					this.vars.cerabox.setStyle('cursor','auto').removeEvents('click');
					if (true===options.clickToClose)
						this.vars.cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));
					this._showInit();
					this.showAjax(index, options);
				}.bind(this));
			}
			else if (item.get('href').test(/^#/i)) {
				item.addEvent('click', function(event){
					if (event)
						event.preventDefault();
					if (this.vars.busy)
						return;
					this.vars.busy=true;
					// Add events
					this._addCallbacks((typeof options.events != 'undefined')?options.events:null);
					// Protection
					this.vars.cerabox.getElement('.cerabox-content-protection').setStyle('display','none');
					// Click to close
					this.vars.cerabox.setStyle('cursor','auto').removeEvents('click');
					if (true===options.clickToClose)
						this.vars.cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));
					this._showInit();
					this.showInline(index, options);
				}.bind(this));
			}
			else if (item.get('href').test(/\.(jpg|jpeg|png|gif|bmp)(.*)?$/i)) {
				item.addEvent('click', function(event){
					if (event)
						event.preventDefault();
					if (this.vars.busy)
						return;
					this.vars.busy=true;
					// Add events
					this._addCallbacks((typeof options.events != 'undefined')?options.events:null);
					// Protection
					if (true===this.options.addContentProtectionLayer)
						this.vars.cerabox.getElement('.cerabox-content-protection').setStyle('display','block');
					// Click to close
					this.vars.cerabox.setStyle('cursor','auto').removeEvents('click');
					if (true===options.clickToClose)
						this.vars.cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));
					this._showInit();
					this.showImage(index, options);
				}.bind(this));
			}
			else if (item.get('href').test(/\.swf$/i)) {
				item.addEvent('click', function(event){
					if (event)
						event.preventDefault();
					if (this.vars.busy)
						return;
					this.vars.busy=true;
					// Add events
					this._addCallbacks((typeof options.events != 'undefined')?options.events:null);
					// Protection
					this.vars.cerabox.getElement('.cerabox-content-protection').setStyle('display','none');
					// Click to close
					this.vars.cerabox.setStyle('cursor','auto').removeEvents('click');
					if (true===options.clickToClose)
						this.vars.cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));
					this._showInit();
					this.showSwf(index, options);
				}.bind(this));
			}
			else {
				item.addEvent('click', function(event){
					if (event)
						event.preventDefault();
					if (this.vars.busy)
						return;
					this.vars.busy=true;
					// Add events
					this._addCallbacks((typeof options.events != 'undefined')?options.events:null);
					// Protection
					this.vars.cerabox.getElement('.cerabox-content-protection').setStyle('display','none');
					// Click to close
					this.vars.cerabox.setStyle('cursor','auto').removeEvents('click');
					if (true===options.clickToClose)
						this.vars.cerabox.setStyle('cursor','pointer').addEvent('click', function(event){event.stop(); this.close();}.bind(this));
					this._showInit();
					this.showIframe(index, options);
				}.bind(this));
			}
		}.bind(this));
	},
	
	/**
	 * Display AJAX item
	 * 
	 * @param array index
	 * @param object options
	 */
	showAjax: function(index, options) {
		//if (this.vars.busy)
			//return;
		
		var ceraBox = this;
		
		var items		= this.vars.items[index[0]];
		var currentItem	= items[index[1]];
		
		this.loaderTimer = this._displayLoader.delay(200, this, [options.loaderAtItem, currentItem]);
		
		var requestEr = new Request.HTML({
			url: currentItem.get('href'),
			method: options.ajax.method?options.ajax.method:'post',
			data: options.ajax.data?options.ajax.data:'',
			
			onSuccess: function(responseTree) {
				if (false===ceraBox.vars.busy)
					return;
				
				clearInterval(ceraBox.loaderTimer);
				document.id('cerabox-loading').setStyle('display', 'none');
				
				if (false!==options.displayOverlay)
					ceraBox._displayOverlay();
				
				var ajaxEle = ceraBox.vars.cerabox.getElement('#cerabox-ajaxPreLoader').empty().adopt(responseTree);
				// Needed to know its size
				ceraBox.vars.cerabox.setStyle('display','block');
				
				ajaxEle.setStyle('width', options.width?options.width:ajaxEle.getScrollSize().x + 'px');
				ajaxEle.setStyle('height', options.height?options.height:ajaxEle.getScrollSize().y + 'px');
				
				var dimension = ceraBox._getSizeElement(ajaxEle, (true===options.fullSize?true:false));
				
				ajaxEle = ajaxEle.get('html');
				ceraBox.vars.cerabox.getElement('#cerabox-ajaxPreLoader').empty().setStyles({'width':'auto','height':'auto'});

				// Hide title
				ceraBox.vars.cerabox.getElement('.cerabox-title span')
					.setStyle('display','none')
					.empty();
				
				// If window open morph to new size
				if (ceraBox.vars.windowOpen==true) {
					ceraBox._transformItem(dimension.width, dimension.height);
				}	
				
				ceraBox.vars.cerabox.getElement('.cerabox-content').set('tween', {duration: 300}).tween('opacity',0)
					.get('tween')
					.addEvent('complete', function(){
						this.removeEvents('complete');
						
						if (false===ceraBox.vars.busy)
							return;
						
						if (false!==options.displayTitle)
							ceraBox.vars.cerabox.getElement('.cerabox-title span')
								.setStyle('display','block')
								.set('text',(items.length>1?'Item ' + (index[1]+1) + ' / ' + items.length + ' ':'') + (currentItem.get('title')?currentItem.get('title'):''));
						
						ceraBox.vars.cerabox.getElement('.cerabox-content')
							.empty()
							.setStyle('opacity',0)
							.set('html', ajaxEle);
						
						ceraBox._openWindow(dimension.width, dimension.height, options.animation?options.animation:'fade', index);
					});
			},
			onTimeout: function() { ceraBox._timedOut(index, options); },
			onFailure: function() { ceraBox._timedOut(index, options); },
			onException: function() { ceraBox._timedOut(index, options); }
		}).send();
	},

	/**
	 * Display Inline item
	 *
	 * @param array index
	 * @param object options
	 */
	showInline: function(index, options) {
		//if (this.vars.busy)
			//return;

		//this.vars.busy = true;

		var ceraBox = this;

		var items		= this.vars.items[index[0]];
		var currentItem	= items[index[1]];
		
		// Inline content
		var inlineEle   = (currentItem.get('href').test(/^#\$/i) && typeof window[currentItem.get('href').replace(/^#\$/i,'')] != 'undefined')
			? ((typeof window[currentItem.get('href').replace(/^#\$/i,'')] != 'object') ? new Element('div',{'html':window[currentItem.get('href').replace(/^#\$/i,'')]}) : window[currentItem.get('href').replace(/^#\$/i,'')])
			: (document.id(document.body).getElement(currentItem.get('href')) ? document.id(document.body).getElement(currentItem.get('href')).clone(true, true) : null);

		if (null!==inlineEle) {

			if (false!==options.displayOverlay)
				ceraBox._displayOverlay();

			var inlineEleClone = ceraBox.vars.cerabox.getElement('#cerabox-ajaxPreLoader').empty().adopt(inlineEle.clone(true, true));
			// Needed to know its size
			ceraBox.vars.cerabox.setStyle('display','block');
			
			inlineEleClone.setStyle('width', options.width?options.width:inlineEleClone.getScrollSize().x + 'px');
			inlineEleClone.setStyle('height', options.height?options.height:inlineEleClone.getSize().y + 'px');

			var dimension = ceraBox._getSizeElement(inlineEleClone, (true===options.fullSize?true:false));

			//inlineEle = inlineEle.get('html');
			ceraBox.vars.cerabox.getElement('#cerabox-ajaxPreLoader').empty().setStyles({'width':'auto','height':'auto'});

			// Hide title
			ceraBox.vars.cerabox.getElement('.cerabox-title span')
				.setStyle('display','none')
				.empty();

			// If window open morph to new size
			if (ceraBox.vars.windowOpen==true) {
				ceraBox._transformItem(dimension.width, dimension.height);
			}

			ceraBox.vars.cerabox.getElement('.cerabox-content').set('tween', {duration: 300}).tween('opacity',0)
				.get('tween')
				.addEvent('complete', function(){
					this.removeEvents('complete');

					if (false===ceraBox.vars.busy)
						return;

					if (false!==options.displayTitle)
						ceraBox.vars.cerabox.getElement('.cerabox-title span')
							.setStyle('display','block')
							.set('text',(items.length>1?'Item ' + (index[1]+1) + ' / ' + items.length + ' ':'') + (currentItem.get('title')?currentItem.get('title'):''));

					ceraBox.vars.cerabox.getElement('.cerabox-content')
						.empty()
						.setStyle('opacity',0)
						.adopt(inlineEle);

					ceraBox._openWindow(dimension.width, dimension.height, options.animation?options.animation:'fade', index);
				});
		}
		// Ere
		else {
			ceraBox._timedOut(index, options);
		}
	},
	
	/**
	 * Display image item
	 * 
	 * @param array index
	 * @param object options
	 */
	showImage: function(index, options) {
		//if (this.vars.busy)
			//return;
		
		var ceraBox = this;
		
		var items		= this.vars.items[index[0]];
		var currentItem	= items[index[1]];

		this.loaderTimer = this._displayLoader.delay(200, this, [options.loaderAtItem, currentItem]);
		
		var image = new Asset.image(currentItem.get('href'), {
			onload: function() {
				//ceraBox.vars.busy = true;

				if (false===ceraBox.vars.busy)
					return;
				
				document.id('cerabox-loading').setStyle('display', 'none');
				
				if (false!==options.displayOverlay)
					ceraBox._displayOverlay();

				clearInterval(ceraBox.loaderTimer);

				this.set('width', options.width?options.width:this.get('width'));
				this.set('height', options.height?options.height:this.get('height'));
				
				var dimension = ceraBox._getSizeElement(this, (true===options.fullSize?true:false));
				
				// Hide title
				ceraBox.vars.cerabox.getElement('.cerabox-title span')
					.setStyle('display','none')
					.empty();
				
				// If window open morph to new size
				if (ceraBox.vars.windowOpen==true) {
					ceraBox._transformItem(dimension.width, dimension.height);
				}
				
				ceraBox.vars.cerabox.getElement('.cerabox-content').set('tween', {duration: 300}).tween('opacity',0)
					.get('tween')
					.addEvent('complete', function(){
						this.removeEvents('complete');
						
						if (false===ceraBox.vars.busy)
							return;
						
						if (false!==options.displayTitle)
							ceraBox.vars.cerabox.getElement('.cerabox-title span')
								.setStyle('display','block')
								.set('text',(items.length>1?'Item ' + (index[1]+1) + ' / ' + items.length + ' ':'') + (currentItem.get('title')?currentItem.get('title'):''));
						
						ceraBox.vars.cerabox.getElement('.cerabox-content')
							.empty()
							.setStyle('opacity',0)
							.adopt(image);
						
						ceraBox._openWindow(dimension.width, dimension.height, options.animation?options.animation:'fade', index);
					});
			},
			onerror: function() {
				ceraBox._timedOut(index, options);
			}
		});
	},
	
	/**
	 * Display swf item
	 * 
	 * @param array index
	 * @param object options
	 */
	showSwf: function(index, options) {
		//if (this.vars.busy)
			//return;
		
		var ceraBox = this;
		
		var items		= this.vars.items[index[0]];
		var currentItem	= items[index[1]];
		
		// Hide title
		ceraBox.vars.cerabox.getElement('.cerabox-title span')
			.setStyle('display','none')
			.empty();
		
		var dimension = {width:options.width?options.width:500, height:options.height?options.height:400};
		
		var swfEr = new Swiff(currentItem.get('href'), {
			width: dimension.width,
		    height: dimension.height,
			params: {
				wMode: 'opaque'
		    }
		});
		
		if (false!==options.displayOverlay)
			ceraBox._displayOverlay();
		
		// If window open morph to new size
		if (ceraBox.vars.windowOpen==true) {
			ceraBox._transformItem(dimension.width, dimension.height);
		}
		
		ceraBox.vars.cerabox.getElement('.cerabox-content').set('tween', {duration: 300}).tween('opacity',0)
			.get('tween')
			.addEvent('complete', function(){
				this.removeEvents('complete');
				
				if (false===ceraBox.vars.busy)
					return;
				
				if (false!==options.displayTitle)
					ceraBox.vars.cerabox.getElement('.cerabox-title span')
						.setStyle('display','block')
						.set('text',(items.length>1?'Item ' + (index[1]+1) + ' / ' + items.length + ' ':'') + (currentItem.get('title')?currentItem.get('title'):''));
				
				ceraBox.vars.cerabox.getElement('.cerabox-content')
					.empty()
					.setStyle('opacity',0)
					.adopt(swfEr);
				
				ceraBox._openWindow(dimension.width, dimension.height, options.animation?options.animation:'fade', index);
			});
	},
	
	/**
	 * Display iframe item
	 * 
	 * @param array index
	 * @param object options
	 */
	showIframe: function(index, options) {
		//if (this.vars.busy)
			//return;
		
		var ceraBox = this;
		
		var items		= this.vars.items[index[0]];
		var currentItem	= items[index[1]];
		
		this.loaderTimer = this._displayLoader.delay(200, this, [options.loaderAtItem, currentItem]);
		// Set timeout timer incase request cannot be done
		this.timeOuter = this._timedOut.delay(10000, this, [index, options]);
		
		var ceraIframe = new IFrame({
			src: currentItem.get('href'),

			styles: {
				width: 1,
				height: 1,
				border: '0px'
			},

			events: {
				load: function() {
					if (false===ceraBox.vars.busy && ceraBox.vars.windowOpen!==true)
						return;

					clearInterval(ceraBox.timeOuter);
					clearInterval(ceraBox.loaderTimer);
					document.id('cerabox-loading').setStyle('display', 'none');

					if (false!==options.displayOverlay)
						ceraBox._displayOverlay();

					this.setStyles({
						width: options.width?options.width:'1px',
						height: options.height?options.height:'1px',
						border: '0'
					});

					ceraBox.vars.cerabox.setStyle('display', 'block');

					var dimension = ceraBox._getSizeElement(this, (true===options.fullSize?true:false));

					// Hide title
					ceraBox.vars.cerabox.getElement('.cerabox-title span')
						.setStyle('display','none')
						.empty();

					// If window open morph to new size
					if (ceraBox.vars.windowOpen==true) {
						ceraBox._transformItem(dimension.width, dimension.height);
					}

					ceraBox._openWindow(dimension.width, dimension.height, options.animation?options.animation:'fade', index);
				}
			}
		});
		
		ceraIframe.set('border','0');
		ceraIframe.set('frameborder','0');

		// Open it so onload fires
		this.vars.cerabox.getElement('.cerabox-content')
			.empty()
			.setStyle('opacity',0)
			.adopt(ceraIframe);
	},
	
	/**
	 * Close box
	 */
	close: function(terminate) {
		if (this.vars.busy && !terminate)
			return;
		
		this.vars.busy = !terminate;

		clearInterval(this.timeOuter);
		clearInterval(this.loaderTimer);
		document.id('cerabox-loading').setStyle('display', 'none');
		
		var ceraBox = this;
		
		ceraBox.vars.cerabox.set('tween', {duration: 50}).tween('opacity', 0).get('tween')
			.addEvent('complete', function() {
				this.removeEvents('complete');
				
				this.element.setStyle('display','none');
				document.id('cerabox-background').set('tween', {duration: 150,link:'chain'}).tween('opacity',0).tween('display','none').get('tween')
					.addEvent('chainComplete', function() {
						this.removeEvents('chainComplete');

						ceraBox.vars.cerabox.getElement('.cerabox-content').empty();
						ceraBox.vars.cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
						ceraBox.vars.cerabox.getElement('.cerabox-right').removeEvents('click').setStyle('display','none');

						var collection	= ceraBox.vars.items[ceraBox.vars.currentIndex[0]];
						var currentItem = collection[ceraBox.vars.currentIndex[1]];

						if (ceraBox.vars.windowOpen){
							if (null!==ceraBox.options.events._onClose)
								ceraBox.options.events._onClose.call(ceraBox, currentItem, collection);
							else
								ceraBox.options.events.onClose.call(ceraBox, currentItem, collection);
						}
						
						ceraBox.vars.windowOpen = false;
						ceraBox.vars.busy = false;
					});
			});
	},
	
	/**
	 * Inject needed HTML to the body
	 */
	initHTML: function() {
		var wrapper = document.id(document.body);
		
		wrapper.adopt([
				new Element('div',{'id':'cerabox-loading'}).adopt(new Element('div')),
				new Element('div',{'id':'cerabox-background', 'styles':{'height':wrapper.getScrollSize().y+'px'}, 'events':{'click':function(event){event.stop();this.close()}.bind(this)}}),
				this.vars.cerabox = new Element('div',{'id':'cerabox'}).adopt([
				                                    new Element('div', {'class':'cerabox-content'}),
				                                    new Element('div', {'class':'cerabox-title'}).adopt(new Element('span')),
				                                    new Element('a', {'class':'cerabox-close','events':{'click':function(event){event.stop();this.close()}.bind(this)}}),
				                                    new Element('a', {'class':'cerabox-left'}).adopt(new Element('span')),
				                                    new Element('a', {'class':'cerabox-right'}).adopt(new Element('span')),
													new Element('div', {'class':'cerabox-content-protection'}),
				                                    new Element('div', {'id':'cerabox-ajaxPreLoader', 'styles':{'float':'left','overflow':'hidden','display':'block'}})
				])
		]);
	},
	
	/**
	 * Has timed out display error
	 * 
	 * @param array index
	 */
	_timedOut: function(index, options) {
				
		this.vars.busy = true;
		
		clearInterval(this.loaderTimer);
		document.id('cerabox-loading').setStyle('display', 'none');
		
		this._displayOverlay();
		
		this.vars.cerabox.getElement('.cerabox-title span')
			.setStyle('display','none')
			.empty();
		
		var ceraBox = this;
		
		var items = this.vars.items[index[0]];
		
		this.vars.cerabox.getElement('.cerabox-content').set('tween', {duration: 300}).tween('opacity',0)
			.get('tween')
			.addEvent('complete', function(){
				this.removeEvents('complete');
				
				if (false===ceraBox.vars.busy)
					return;
				
				ceraBox.vars.cerabox.getElement('.cerabox-content')
					.empty()
					.setStyle('opacity',0)
					.adopt(new Element('span',{'text':ceraBox.options.errorLoadingMessage}))
					.set('tween', {duration: 100}).tween('opacity',1);
				
				ceraBox._openWindow(250, 50, options.animation?options.animation:'fade', index);
				
				/*if (true===options.fullSize)
					ceraBox._resize();*/
			});
		
		
		// If window open morph to new size
		if (ceraBox.vars.windowOpen==true) {
			ceraBox._transformItem(250, 50);
		}
	},
	
	/**
	 * Add navigation buttons for group items
	 * 
	 * @param array index
	 */
	_addNavButtons: function(index) {
		var ceraBox = this;

		if (true===ceraBox.vars.busy)
			return;

		this.vars.cerabox.getElement('.cerabox-left').removeEvents('click').setStyle('display','none');
		this.vars.cerabox.getElement('.cerabox-right').removeEvents('click').setStyle('display','none');
		
		if (this.vars.items[index[0]][(index[1]-1)]) {
			this.vars.cerabox.getElement('.cerabox-left').setStyle('display','block').addEvent('click', function(event){

				event.stopPropagation();
				this.setStyle('display','none').removeEvents('click');
				ceraBox.vars.items[index[0]][(index[1]-1)].fireEvent('click', event);
			});
		}
		if (this.vars.items[index[0]][(index[1]+1)]) {
			this.vars.cerabox.getElement('.cerabox-right').setStyle('display','block').addEvent('click', function(event){

				event.stopPropagation();
				this.setStyle('display','none').removeEvents('click');
				ceraBox.vars.items[index[0]][(index[1]+1)].fireEvent('click', event);
			});
		}
	},
	
	/**
	 * Transform item to an other size
	 * 
	 * @param int width
	 * @param int height
	 * @return morph
	 */
	_transformItem: function(width, height) {
		var morphObject = {
			'display':'block',
			'width':width,
			'height':height,
			'opacity':1
		};
		if (window.getSize().x > this.vars.cerabox.getSize().x+40 && window.getSize().x > width+40) {
			this.vars.cerabox.setStyles({
				'left':((window.getSize().x/2)) + 'px',
				'right':'auto'
			});
			morphObject['margin-left'] = ((-width/2)+document.id(document.body).getScroll().x) + 'px';
		}
		else {
			this.vars.cerabox.setStyles({
				'margin-left':'0',
				'left':'auto',
				'right':'20px'
			});
		}
		if (window.getSize().y > this.vars.cerabox.getSize().y+40 && window.getSize().y > height+40) {
			this.vars.cerabox.setStyles({
				'top':((window.getSize().y/2)) + 'px'
			});
			morphObject['margin-top'] = ((-height/2)+document.id(document.body).getScroll().y) + 'px';
		}
		else {
			if (height+40 > (document.id(document.body).getScrollSize().y-document.id(document.body).getScroll().y)) {
				this.vars.cerabox.setStyles({
					'margin-top':'0',
					'top':(document.id(document.body).getScrollSize().y-(height+60)>20?document.id(document.body).getScrollSize().y-(height+60):20) + 'px'
				});
			}
			else {
				this.vars.cerabox.setStyles({
					'margin-top':'0',
					'top':document.id(document.body).getScroll().y + 20 + 'px'
				});
			}
		}
		return this.vars.cerabox.set('morph', {duration: 150})
			.morph(morphObject).get('morph');
	},
	
	/**
	 * Initialize show function
	 */
	_showInit: function() {
		//if (this.vars.busy)
			//return;
		
		// Make sure it doesnt time out when started a new request and prev loader is gone
		clearInterval(this.timeOuter);
		clearInterval(this.loaderTimer);
		document.id('cerabox-loading').setStyle('display', 'none');
	},
	
	/**
	 * Open cerabox window
	 * 
	 * @param int width
	 * @param int height
	 * @param string[optional] animation 'ease'|'fade'
	 * @param array[optional] index item
	 */
	_openWindow: function(width, height, animation, index) {
		if (this.vars.cerabox.getElement('.cerabox-content iframe'))
			this.vars.cerabox.getElement('.cerabox-content iframe').setStyles({'width':width,'height':height});
		
		this.vars.currentIndex = index = index ? index : this.vars.currentIndex;
		var currentItem = this.vars.items[index[0]][index[1]];

		var ceraBox = this;

		if (this.vars.windowOpen==true) {
			this.vars.cerabox.getElement('.cerabox-content')
				.setStyle('opacity',0)
				.set('tween', {duration: 200}).tween('opacity',1)
				.get('tween')
				.addEvent('complete', function(){
					this.removeEvents('complete');

					ceraBox.vars.busy = false;

					ceraBox._addNavButtons(index);

					// onChange event
					if (null!==ceraBox.options.events._onChange)
						ceraBox.options.events._onChange.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
					else
						ceraBox.options.events.onChange.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
				});
			return;
		}
		
		this.vars.cerabox.getElement('.cerabox-content').setStyle('opacity',1);

		// onOpen event
		if (null!==this.options.events._onOpen)
			this.options.events._onOpen.call(this, currentItem, this.vars.items[index[0]]);
		else
			this.options.events.onOpen.call(this, currentItem, this.vars.items[index[0]]);


		// Holds the position to morph to
		var morphObject = {};

		if (window.getSize().x > width+40) {
			Object.append(morphObject, {
				'margin-left':(width>0?((-width/2)+document.id(document.body).getScroll().x):0) + 'px',
				'left':((window.getSize().x/2)) + 'px',
				'right':'auto'
			});
		}
		else {
			Object.append(morphObject, {
				'margin-left':'0',
				'left':((window.getSize().x - (width+20))+document.id(document.body).getScroll().x) + 'px',
				'right':'20px'
			});
		}
		if (window.getSize().y > height+40) {
			Object.append(morphObject, {
				'margin-top':(height>0?((-height/2)+document.id(document.body).getScroll().y):0) + 'px',
				'top':((window.getSize().y/2)) + 'px',
				'bottom':'auto'
			});
		}
		else {
			if (height+40 > (document.id(document.body).getScrollSize().y-document.id(document.body).getScroll().y)) {
				Object.append(morphObject, {
					'margin-top':'0',
					'top':(document.id(document.body).getScrollSize().y-(height+60)>20?document.id(document.body).getScrollSize().y-(height+60):20) + 'px'
				});
			}
			else {
				Object.append(morphObject, {
					'margin-top':'0',
					'top':document.id(document.body).getScroll().y + 20 + 'px'
				});
			}
		}

		switch (animation) {
		case 'ease':
			Object.append(morphObject, {
				'width':width,
				'height':height,
				'opacity':1
			});

			this.vars.cerabox.setStyles({
				'display':'block',
				'left':currentItem.getPosition().x + 'px',
				'top':currentItem.getPosition().y + 'px',
				'width':currentItem.getSize().x + 'px',
				'height':currentItem.getSize().y + 'px',
				'margin':0,
				'opacity':0
			}).set('morph', {duration: 200}).morph(morphObject).get('morph')
				.addEvent('complete', function(){
					this.removeEvents('complete');

					ceraBox.vars.busy = false;

					ceraBox._addNavButtons(index);

					// onChange event
					if (null!==ceraBox.options.events._onAnimationEnd)
						ceraBox.options.events._onAnimationEnd.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
					else
						ceraBox.options.events.onAnimationEnd.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
				});
			break;
		case 'fade':
		default:
			Object.append(morphObject, {
				'display':'block',
				'width':width,
				'height':height,
				'opacity':0
			});

			this.vars.cerabox.setStyles(morphObject).set('tween', {duration: 200}).tween('opacity', 1)
				.get('tween')
				.addEvent('complete', function(){
					this.removeEvents('complete');

					ceraBox.vars.busy = false;

					ceraBox._addNavButtons(index);

					// onChange event
					if (null!==ceraBox.options.events._onAnimationEnd)
						ceraBox.options.events._onAnimationEnd.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
					else
						ceraBox.options.events.onAnimationEnd.call(ceraBox, currentItem, ceraBox.vars.items[index[0]]);
				});
			break;
		}

		currentItem.blur();
		this.vars.windowOpen = true;
	},
	
	/**
	 * Display transparen overlay
	 */
	_displayOverlay: function() {
		document.id('cerabox-background').setStyles({'display':'block','opacity':.5,'height':document.id(document.body).getScrollSize().y + 'px','width':document.id(document.body).getScrollSize().x + 'px'});
	},
	
	/**
	 * Display loading spinner
	 */
	_displayLoader: function(loaderAtItem, currentItem) {
		// loaderAtItem
		if (true===loaderAtItem && !this.vars.windowOpen)
			document.id('cerabox-loading').setStyles({
				'position': 'absolute',
				'top': (((currentItem.getSize().y/2) - (document.id('cerabox-loading').getStyle('height').toInt()/2)) + currentItem.getPosition().y) + 'px',
				'left': (((currentItem.getSize().x/2) - (document.id('cerabox-loading').getStyle('width').toInt()/2)) + currentItem.getPosition().x) + 'px',
				'margin-left': 0,
				'margin-top': 0
			});
		else
			document.id('cerabox-loading').set('style','');

		document.id('cerabox-loading').setStyle('display','block');
		this._loaderAnimation();
	},
	
	/**
	 * Loader animation
	 * 
	 * @param int frame
	 */
	_loaderAnimation: function(frame) {
		if (!frame)
			frame=0;
		document.id('cerabox-loading').getElement('div').setStyle('top', (frame * -40) + 'px');
		frame = (frame + 1) % 12;
		
		if (document.id('cerabox-loading').getStyle('display')!='none')
			this._loaderAnimation.delay(60, this, frame);
	},
	
	/**
	 * Get size element object
	 * 
	 * @param object element
	 * @return object
	 */
	_getSizeElement: function(element, fullSize) {
		var eleWidth = 0, eleHeight = 0;
		
		if (element.tagName == 'IFRAME') {
			try {
				eleWidth = (element.get('width')?this._sizeStringToInt(element.get('width'),'x'):(element.getStyle('width').toInt()>1?this._sizeStringToInt(element.getStyle('width'),'x'):
					(element.contentWindow.document.getScrollWidth()?element.contentWindow.document.getScrollWidth():window.getSize().x * 0.75)));
			}
			catch(err) {
				eleWidth = window.getSize().x * 0.75;
				this._log(err); // IE6 fix
			}
			
			try {
				eleHeight = (element.get('height')?this._sizeStringToInt(element.get('height'),'y'):(element.getStyle('height').toInt()>1?this._sizeStringToInt(element.getStyle('height'),'y'):
					(element.contentWindow.document.getScrollHeight()?element.contentWindow.document.getScrollHeight():window.getSize().y * 0.75)));
			}
			catch(err) {
				eleHeight = window.getSize().y * 0.75;
				this._log(err); // IE6 fix
			}
			
			if (Browser.ie) {
				eleHeight = eleHeight + 20;
			}
			
			if (false===fullSize) {	
				if ((window.getSize().y - 100)<eleHeight) {
					eleWidth = eleWidth + (Browser.Platform.mac?15:17);
				}
				return {width: (window.getSize().x - 50)<eleWidth?(window.getSize().x - 50):eleWidth, height: (window.getSize().y - 100)<eleHeight?(window.getSize().y - 100):eleHeight};
			} else
				return {width: eleWidth, height: eleHeight};	
		}
		
		eleWidth = (element.get('width')?this._sizeStringToInt(element.get('width'),'x'):(element.getStyle('width')&&element.getStyle('width')!='auto'?this._sizeStringToInt(element.getStyle('width'),'x'):window.getSize().x - 50));
		eleHeight = (element.get('height')?this._sizeStringToInt(element.get('height'),'y'):(element.getStyle('height')&&element.getStyle('height')!='auto'?this._sizeStringToInt(element.getStyle('height'),'y'):window.getSize().y - 100));
		
		if (false===fullSize) {
			var r = Math.min(Math.min(window.getSize().x - 50, eleWidth) / eleWidth, Math.min(window.getSize().y - 100, eleHeight) / eleHeight);
			return {width: Math.round(r * eleWidth), height: Math.round(r * eleHeight)};
		}
		else
			return {width: eleWidth, height: eleHeight};
	},
	
	/**
	 * Get the pixels of given element size
	 * 
	 * @param string size
	 * @param string dimension 'x'|'y'
	 */
	_sizeStringToInt: function(size, dimension) {
		return (typeof size == 'string' && size.test('%')?window.getSize()[dimension]*(size.toInt()/100):size.toInt());
	},
	
	/**
	 * Resizing window
	 */
	_resize: function() {
		if(this.vars.windowOpen==true) {
			document.id('cerabox-background').setStyles({'height':window.getSize().y + 'px','width':window.getSize().x + 'px'});
			if (window.getSize().x > this.vars.cerabox.getSize().x+40) {
				this.vars.cerabox.setStyles({
					'margin-left':(this.vars.cerabox.getSize().x>0?((-this.vars.cerabox.getSize().x/2)+document.id(document.body).getScroll().x):0) + 'px',
					'left':((window.getSize().x/2)) + 'px',
					'right':'auto'
				});
			}
			else {
				this.vars.cerabox.setStyles({
					'margin-left':'0',
					'left':'auto',
					'right':'20px'
				});
			}
			if (window.getSize().y > this.vars.cerabox.getSize().y+40) {
				this.vars.cerabox.setStyles({
					'margin-top':(this.vars.cerabox.getSize().y>0?((-this.vars.cerabox.getSize().y/2)+document.id(document.body).getScroll().y):0) + 'px',
					'top':((window.getSize().y/2)) + 'px',
					'bottom':'auto'
				});
			}
			else {
				if (this.vars.cerabox.getSize().y+40 > (document.id(document.body).getScrollSize().y-document.id(document.body).getScroll().y)) {
					this.vars.cerabox.setStyles({
						'margin-top':'0',
						'top':(document.id(document.body).getScrollSize().y-(this.vars.cerabox.getSize().y+60)>20?document.id(document.body).getScrollSize().y-(this.vars.cerabox.getSize().y+60):20) + 'px'
					});
				}
				else {
					this.vars.cerabox.setStyles({
						'margin-top':'0',
						'top':document.id(document.body).getScroll().y + 20 + 'px'
					});
				}
			}
			document.id('cerabox-background').setStyles({'height':document.id(document.body).getScrollSize().y + 'px','width':document.id(document.body).getScrollSize().x + 'px'});
		}
	},
	
	/**
	 * Add callback functions to cerabox
	 */
	_addCallbacks: function(events) {
		this.options.events._onClose	    = null;
		this.options.events._onOpen		    = null;
		this.options.events._onChange	    = null;
		this.options.events._onAnimationEnd = null;
		if (null !== events) {
			if (typeof events.onClose == 'function')
				this.options.events._onClose = events.onClose;
			if (typeof events.onOpen == 'function')
				this.options.events._onOpen = events.onOpen;
			if (typeof events.onChange == 'function')
				this.options.events._onChange = events.onChange;
			if (typeof events.onAnimationEnd == 'function')
				this.options.events._onAnimationEnd = events.onAnimationEnd;
		}
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