XML2Js Converter
================

Request a XML file then traverse it recursively to build an Object.

How to use
----------

	You first need to create an instance of XML2Object which can be used as many times as needed
	to convert several files and/or xml strings.
	
	var xml2json = new XML2Object();
	
	Once you have an instance of XML2Object, you can do convertions using two public methods,
	convertFromUrl and convertFromString.
	
	ConvertFromUrl:
		Syntax:
		xml2json.convertFromUrl(xmlurl, fn[, options[, id]]);
		
		Arguments:
		xmlurl	- (string) Url location of xml file to convert.
		fn		- (function) The function to run on Success.
		options - (object, optional) Options to merge with request options.
		id		- (string, optional) Convertion id to store convertion results for further retrieval. Likely a caching.
		
		Argument:fn
		
			Syntax:
			fn(resulting_object)
		
		Example:
		xml2json.convertFromURL('test.xml', function(response) {
			console.log(xml);
		});
	
	ConvertFromString:
		
		Syntax:
		xml2json.convertFromString(xmlstring[, id]);
		
		Arguments:
		xmlstring	- (string) XML string to convert.
		id			- (string, optional) Convertion id to store convertion results for furter retrieval. Likely a chaching.
		
		Example:
		var xmlstring="<bookstore><book>";
			xmlstring=xmlstring+"<title>Everyday Italian</title>";
			xmlstring=xmlstring+"<author>Giada De Laurentiis</author>";
			xmlstring=xmlstring+"<year>2005</year>";
			xmlstring=xmlstring+"</book></bookstore>";
			
		console.log( xml2json.convertFromString(xmlstring) );

	
	Retrieve:
	
		Syntax:
		var result = xml2json.retrieve(id);
		
		Arguments:
		id - (string) Stored convertion id passed on convertFromUrl or convertFromString methods.
		
		Returns:
		(object) A stored convertion result.
	
	Remove:
		
		Syntax:
		var deleted = xml2json.remove(id);
		
		Arguments:
		id - (string) Stored convertion id passed on convertFromUrl or convertFromString methods.
		
		Returns:
		(boolean) true or false if delete of storage item was succesfull or not.
		(null) if id doesn't exist in storage.

Resulting Object Structure
--------------------------

It follows the W3C guidelines at http://www.w3schools.com/dom/dom_nodetree.asp
to convert the xml documents.

As an example, a XML file with this content:

	<Map container="map_canvas"
		lat="10.98"
		lng="-74.79"
		zoom="10"
		streetViewControl="false"
		>
		<Marker
			title="Marker 1"
			lat="7.6" lng="-74"
			content="Marker 1 content"       
		>Marker 1 node Value</Marker>
		<Marker
			title="Marker 2"
			lat="7.2" lng="-74"
			content="Marker 2 content"
		/>
	</Map>

Will result in an Object this way:

	Object: {
		attributes: {
			container: "map_canvas",
			lat: "10.98",
			lng: "-74.79",
			streetViewControl: "false",
			zoom: "10"
		},
		name: "Map",
		value: "",
		childNodes: {
			Array[
			0: {
				attributes: {
					title: "Marker 1",
					content: "Marker 1 content",
					lat: "7.6",
					lng: "-74"
				},
				name: "Marker",
			   value: "Marker 1 node Value",
				childNodes: Array[]
			},
			1: {
				attributes: {
					title: "Marker 2",
					content: "Marker 2 content",
					lat: "7.2",
					lng: "-74"
				},
				name: "Marker",
				value: "",
				childNodes: Array[]
			}]
		}
	}

Notice that Marker 1 has content and Marker 2 doesn't, still, the latter will have a value of "".

Since it traverse the XML DOM node tree recursively, it doesn't matter how deep and complex your structure is.

As an example, this class is very usefull with another script which extends Google Maps Api classes, so a really fast setup can be done since a map, markers and else, can be written in a XML file, then converted to Object, and build the map in a more automatic way.
