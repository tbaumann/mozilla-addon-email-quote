

// Inspired by Text::Flowed from cpan

var TextFlowed = {

//	MAX_LENGTH: This is the maximum length that a line is allowed to be
//	(unless faced with a word that is unreasonably long). This module will
//	re-wrap a line if it exceeds this length.
	MAX_LENGTH: 79,

//	OPT_LENGTH: When this module wraps a line, the newly created lines
//	will be split at this length.
	OPT_LENGTH: 72,
	
//	Do we quote?
	QUOTE: true,

	_num_quotes: function(input ){
		return input.match("^(>*)")[0].length;
	},
	 _unquote: function(input){
		var re = /^(>+)/g;
		var line = input.replace(re, "");

		return line;
	},
	_flowed: function(input){
		// Lines with only spaces in them are not considered flowed
		// (heuristic to recover from sloppy user input)
		if(input.match("^ *$")){
			return false;
		}
		return input.match(" $");
	},
	_unstuff: function(input){
		input.replace(/^ /, "");
		return input;
	},
	_trim: function(input){
		input.replace(/ +$/g, "");
		return input;
	},
	_quotes: function(amount){
		var result = "";
		for (var i = 0; i < amount; i++) {
			result = result + ">";
		}
		return result;
	},
	_stuff: function(text, num_quotes){
		if (text.match(/^ /) || text.match(/^>/) || text.match(/^From /) || num_quotes > 0) {
			return " " + text;
		}
		return text;
	},

	reformat: function(inputstr){
		var output = new Array();
		var input = inputstr.split("\n");
		
		var len = input.length >>> 0;
		
		for (var linenr = 0; linenr < len; linenr++) {

			var line = input[linenr];
			var num_quotes = TextFlowed._num_quotes(line);
			line = TextFlowed._unquote(line);
			while (TextFlowed._flowed(line) && input[linenr+1] && TextFlowed._num_quotes(input[linenr+1]) == num_quotes) {
//				Join the next line
				linenr++;
				line = line + TextFlowed._unstuff(TextFlowed._unquote(input[linenr]));
			}
			line = TextFlowed._trim(line);
			if(TextFlowed.QUOTE){
				num_quotes++;
			}

			if(line == ""){
				output.push(TextFlowed._quotes(num_quotes));
			} else if((line.length + num_quotes) <= (TextFlowed.MAX_LENGTH - 1)) {
					output.push(TextFlowed._quotes(num_quotes) + TextFlowed._stuff(line, num_quotes));			
			} else {
//				Rewrap this paragraph
				var maxl = TextFlowed.MAX_LENGTH;
				var optl = TextFlowed.OPT_LENGTH;
				var regex1 = new RegExp("^(.{" + (num_quotes + 1) + "," + maxl + "}) (.*)");
				var regex2 = new RegExp("^(.{" + (num_quotes + 1) + "," + optl + "}) (.*)");
				var regex3 = new RegExp("^(.{" + (num_quotes + 1) + ",})? (.*)");
				while (line != "") {
					line =  TextFlowed._quotes(num_quotes) + TextFlowed._stuff(line, num_quotes);
					var result;
					if (line.length <= TextFlowed.MAX_LENGTH) {
//						Remaining section of line is short enough
						output.push(line);
						break;
					} else {
						result = regex1.exec(line);
						if(result){
							output.push(result[1] + " ");
							line = result[2];
						}else{
							result = regex2.exec(line)
							if(result){
								output.push(result[1] + " ");
								line = result[2];
							}else{
								result = regex3.exec(line)
								if(result){
									output.push(result[1] + " ");
									line = result[2];		
								}
							}
						}
						if(!result){
//					# One excessively long word left on line
							output.push(line);
							break;
						}
					}
				}
			}
		}

		return output.join("\n");
	}
};




var emailquote = {
	init: function() {
		var menu = document.getElementById("contentAreaContextMenu");
		menu.addEventListener("popupshowing", emailquote.showHide, false);
	},

	showHide: function() {
		var pq = document.getElementById("context-emailquote");
    		var p = document.getElementById("context-paste");
    		pq.hidden = p.hidden;
   		 if (document.getElementById("cmd_paste").getAttribute("disabled") == "true") {
      			pq.setAttribute("disabled", "true");
    		} else {
      			pq.removeAttribute("disabled");
   		}
	},

	pasteQuote: function() {
		var theBox = document.commandDispatcher.focusedElement;
		if (!theBox)
			return false;
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
		if (!clip)
			return false;

		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		if (!trans) 
			return false;
		trans.addDataFlavor("text/unicode");
		clip.getData(trans,clip.kGlobalClipboard);

		var str=new Object();
		var strLength=new Object();

		trans.getTransferData("text/unicode",str,strLength);

		if (str) 
			str=str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if (str) 
			pastetext=str.data.substring(0,strLength.value / 2);

		var theBox = document.commandDispatcher.focusedElement;
		var oPosition = theBox.scrollTop;
		var oHeight = theBox.scrollHeight;

		
		str = emailquote.quoteText(str);
		emailquote.insertAtCursor(theBox,str);

		var nHeight = theBox.scrollHeight - oHeight;
		theBox.scrollTop = oPosition + nHeight;
		return true;
	},

	insertAtCursor: function(myField, myValue) {
		// Function taken from http://www.alexking.org/blog/2003/06/02/inserting-at-the-cursor-using-javascript/
		// Modified to return cursor to correct place
		if (myField.selectionStart || myField.selectionStart == '0') {
			var startPos = myField.selectionStart;
			var endPos = myField.selectionEnd;
			myField.value = myField.value.substring(0, startPos)
			+ myValue
			+ myField.value.substring(endPos, myField.value.length);
			var cursorPos = endPos + myValue.length;
			myField.selectionStart = cursorPos;
			myField.selectionEnd = cursorPos;
		} else {
			myField.value += myValue;
		}
	},

	quoteText: function(myText){
	
		var str=new String(myText);
		var result = TextFlowed.reformat(str);

		return result;
	}
}
window.addEventListener('load', emailquote.init, false); 
