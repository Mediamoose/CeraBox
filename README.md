CeraBox
==========

CeraBox is the alternative Lightbox build on MooTools, inspired by Fancybox.net.

Requirements
------

* MooTools 1.4 >
* MooTools More Assets

Usage
-----
Include cerabox.css within your head tags to style the CeraBox, also include MooTools together with cerabox.min.js.

	<head>
        <link rel="stylesheet" href="/cerabox/style/cerabox.css" media="screen" />

        <script src="/mootools/mootools-core-1.4.0.js"></script>
		<script src="/mootools/mootools-more-1.4.0.1-assets.js"></script>
		<script src="/cerabox/cerabox.min.js"></script>
	</head>


Create the elements you want to add to the CeraBox.

    <div class="gallery">
		<a href="/img/image001.jpg" class="ceraBox" title="Image 001">
			<img src="/img/image001_thumb.jpg" alt="Image 001" />
		</a>
		<a href="/img/image002.jpg"" class="ceraBox" title="Image 002">
			<img src="/img/image002_thumb.jpg" alt="Image 002"" />
		</a>
		<a href="/img/image003.jpg' class="ceraBox" title="Image 003">
			<img src="/img/image003_thumb.jpg" alt="Image 003" />
		</a>
	</div>


Add the following script somewhere in your document to make it work.

    <script type="text/javascript">
		window.addEvent('domready', function(){
			$$('.gallery a.ceraBox').cerabox();
		});
	</script>


Examples
--------
Collection (ease animation) and loader on selected item:

	$$('#example1 a').cerabox({
		animation: 'ease',
		loaderAtItem: true
	});


Ajax:

	$$('#example3 a.ajax').cerabox({
		displayTitle: false,
		ajax: {
			type: 'post',
			data: 'mydata=test&q=more&vars=true'
		}
	});


For more examples visit the example page http://cerabox.net/examples

License
-------

Copyright (c) 2011-2012 Ceramedia, <http://ceramedia.net/>

MIT license

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
