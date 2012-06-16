/*
---
name:		 XML2Js
description:
	Provides an easy way to read XML files while converting it's content to an Object.
	This plugin was written thanks to w3schools documentation: http://www.w3schools.com/dom/dom_nodetree.asp

license: MIT-style

authors:
- Ciul

requires:
- core/Types *
- core/Browser
- core/Request
- core/Class
- core/Class.Extras

provides: [XML2Object]

...
*/

(function($) { // Dollar Safe Mode
	var $global = this; // Window Object for Global Scope Definition
	
	var XML2Object = $global.XML2Object = new Class({
		Implements: [Events],
		
		// Properties
		$xml:	null,
		$json:	null,
		$store: null,
		
		// Initialize
		initialize: function() {
			this.$xml	= '';
			this.$json	= {};
			this.$store	= {};
			
			/**
			 * Retrieve static $instance property,
			 * which holds instance of this class, or assign it if not set yet.
			 **/
			if ( instanceOf($global.XML2Object.$instance, $global.XML2Object) ) {
				return $global.XML2Object.$instance
			} else {
				$global.XML2Object.$instance = this;
			}
			return this;
		},
		
		/********************** PRIVATE XML2Object METHODS **********************/
		
		/* This method is meant for internal use only */
		$recursive_traverse: function(node) {
			var attributes = new Object();
			if (this.$has_attributes(node)) {
				Array.each(this.$get_node_attributes(node), function(attribute, index) {
					attributes[this.$get_node_name(attribute)] = this.$get_node_value(attribute);
				}, this);
			}
			
			var childNodes = new Array();
			if (this.$has_childNodes(node)) {
				Array.each(this.$get_childElements(node), function(child, index) {
					var childNode = this.$recursive_traverse(child);
					childNodes.append([childNode]);
				}, this);
			}
			
			// Remove \n line breaks from node value.
			var value = this.$get_node_value(node);
			if (Type.isString(value))
				value = value.split('\n')[0];
			
			var obj = {
				name: 		this.$get_node_name(node),
				value:		value,
				attributes: attributes,
				childNodes: childNodes
			};
			
			return obj;
		},
		
		/* This method is meant for internal use only */
		$get_document_rootNode: function() {
			return this.$xml.documentElement;
		},
		
		$get_node_name: function(node) {
			var name = node.nodeName;
			return name;
		}.protect(),
		
		$get_node_value: function(node) {
			/**
			 * In the DOM, everything is a node. Element nodes do not have a text value.
			 * The text of an element node is stored in a child node. This node is called a text node.
			 * The way to get the text of an element is to get the value of the child node (text node).
			 **/
			
			var value = '';
			switch (this.$get_node_type(node)) {
				case 1:
					// For Element nodes, IE doesn't support node.textContent property. Instead use node.text
					value = Browser.ie ? node.text : node.textContent ;
					break;
				default:
					value = node.nodeValue;
			}
			
			// Convert string values to their respective type.
			value = Number.from(value) !== null ? Number.from(value) : value; 
			value = value === 'true' ? true : value;
			value = value === 'false' ? false : value;
			
			return value;
		}.protect(),
		
		$get_node_type: function(node) {
			var type = node.nodeType;
			return type;
		}.protect(),
		
		$has_childNodes: function(node) {
			return (!!node.childNodes && node.childNodes.length != 0);
		}.protect(),
		
		$get_node_children: function(node) {
			if (this.$has_childNodes(node)) {
				var children = node.childNodes;
				return children;
			}
			return null;
		}.protect(),
		
		$get_childElements: function(node) {
			var chel = this.$get_node_children(node);
			chel	 = this.$filter_byType(chel, 1);
			return chel;
		},
		
		$has_attributes: function(node) {
			return (!!node.attributes && node.attributes.length != 0);
		}.protect(),
		
		$get_node_attributes: function(node) {
			if (this.$has_attributes(node)) {
				var attrs = node.attributes;
				return attrs;
			}
			return null;
		}.protect(),
		
		$get_attribute: function(node, attribute) {
			if (this.$has_attributes(node)) {
				var attrValue = node.getAttribute(attribute);
				return attrValue;
			}
			return null;
		}.protect(),
		
		$collection_toArray: function(nodesCollection) {
			var nodesArray = [];
			Array.each(nodesCollection, function(node) {
				if (this.$get_node_type(node) == 1) {
					nodesArray.append([node]);
				}
			}, this);
			return nodesArray;
		}.protect(),
		
		$filter_byType: function(nodes, type) {
			type = Type.isNumber(type) ? type : 1;
			var filteredNodes = this.$xml.createElement('filteredNodes');
			for (i=0;i<nodes.length;i++) {
				if (nodes[i].nodeType == type) {
					var newNode = nodes[i].cloneNode(true);
					filteredNodes.appendChild(newNode);
				}
			}
			return filteredNodes.childNodes;
		}.protect(),
		
		$get_fromPath: function(source, path) {
			var parts = path.split('.');
			for (var i = 0, l = parts.length; i < l; i++){
				if (source.hasOwnProperty(parts[i])) {
					source = source[parts[i]];
				} else return null;
			}
			return source;
		},
		
		$append_toPath: function(source, path, val) {
			var parts = key.split('.'),
				source2 = source; // so we can return the object
			for (var i = 0, l = parts.length; i < l; i++) {
				// So when the value does not exist (and is an own property) or is not an object
				if (i < (l - 1) && (!source.hasOwnProperty(parts[i]) || !Type.isObject(source[i]))){
					source[parts[i]] = {};
				}

				if (i == l - 1) source[parts[i]] = val;
				else source = source[parts[i]];
			}
			// Return the modified object
			return source2;
		},
		
		$storeResult: function(id, json) {
			if (!Type.isString(id) || !Type.isObject(json))
				return;
			
			this.$store[id] = json;
		},
		
		/********************** PUBLIC XML2Object METHODS **********************/
		
		/**
		 * name: convertFromString
		 * description: Converts a XML string.
		 * arguments:
		 *		@string		xmlstring	XML string definition to convert.
		 *		@string		id			[optional] Convertion id to store convertion results for further retrieval. Likely a caching.
		 * return:
		 *		@object		object		Convertion result object.
		 **/
		convertFromString: function(xmlstring, id) {
			var parser, xmlDoc;
			if (window.DOMParser) {
				parser = new DOMParser();
				xmlDoc = parser.parseFromString(xmlstring, 'text/xml');
			} else if (Browser.ie) {
				// IE doesn't support DOMParser.
				parser		 = new ActiveXObject('Microsoft.XMLDOM');
				parser.async = false;
				xmlDoc		 = parser.loadXML(xmlstring);
			}
			
			this.$xml = xmlDoc; 
			var root  = this.$get_document_rootNode();
			var json  = this.$json = this.$recursive_traverse(root);
			
			this.$storeResult(id, json);
			return json;
		},
		
		// Mapped method to convertFromString
		toString: function(xmlstring, id) {
			return this.convertFromString(xmlstring, id);
		},
		
		/**
		 * name: convertFromURL
		 * description: Converts a XML file located on URL.
		 * arguments:
		 *		@string		xmlurl		Url location of XML file to convert.
		 *		@function	fn			Function to run on complete event after file convertion.
		 *		@object		options		[optional] Options to merge with request options.
		 *		@string		id			[optional] Convertion id to store convertion results for further retrieval. Likely a caching.
		 * return:
		 *		@object		request		Request instance resulting while requesting from xml file.
		 **/
		convertFromURL: function(xmlurl, fn, options, id) {
			var options = options || {};
			var requestOptions = {
				method:		'get',
				url:		xmlurl,
				noCache:	true
			};
			
			Object.merge(requestOptions, options, {
				onSuccess: function(textResponse, xmlResponse) {
					this.$xml 	= xmlResponse;
					var root	= this.$get_document_rootNode();
					var json	= this.$json = this.$recursive_traverse(root);
					this.$storeResult(id, json);
					fn.call(this, json);
				}.bind(this)
			});
			
			return new Request(requestOptions).send();
		},
		
		/**
		 * name: retrieve
		 * description: Retrieves an object result previously stored.
		 * arguments:
		 *		@string		id			Convertion id stored result for retrieval.
		 * return:
		 *		@object		object		Convertion result object or null if id is not found.
		 **/
		retrieve: function(id) {
			if (this.$store.hasOwnProperty(id)) {
				return this.$store[id];
			}
			return null;
		},
		
		/**
		 * name: remove
		 * description: Removes an object result previously stored.
		 * arguments:
		 *		@string		id			Convertion id stored result for retrieval.
		 * return:
		 *		@object		object		Result from deleting object in store or null if id is not found.
		 **/
		remove: function(id) {
			if (this.$store.hasOwnProperty(id)) {
				this.$store[id] = null;
				return delete this.$store[id];
			}
			return null;
		}
	
	});
	
	/**
	 * Extend static $instance property which holds an instance of XML2Object,
	 * since just one is capable of being reused for multiple conversions.
	 **/
	XML2Object.extend({
		$instance: null
	});
	
})(document.id);