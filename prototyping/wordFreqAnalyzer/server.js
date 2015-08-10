var express = require('express');
var R = require('ramda');
var wikipedia = require("node-wikipedia");
var striptags = require('striptags');
var pos = require('pos');
var natural = require('natural');
var nounInflector = new natural.NounInflector();
var app = express();

app.get('/', function (req, res) {
	var output = {};
	var query = "category";

	wikipedia.page.data(query, { content: true }, function(response) {
		var strippedResponse = striptags(response.text["*"]);
		strippedResponse = strippedResponse.replace(/\n/g, ' ').replace(/  +/g, ' ').replace(/[^a-z ]/ig, '').toLowerCase();

		var words = new pos.Lexer().lex(strippedResponse);
		var tagger = new pos.Tagger();
		var taggedWords = tagger.tag(words);

		var nounHash = {};
		for (i in taggedWords) {
			var word = taggedWords[i][0];
			if (word.length <= 1) { continue; }
			if (word === 'isbn') { continue; }
			if (word === 'pres') { continue; }

			var queries = query.toLowerCase().split(" ");
			if (R.contains(word, queries)) { continue; }

			queries = query.toLowerCase().split(" ").join("");
			if (word === queries) { continue; }

			if (R.contains(partOfSpeech, ['NN', 'NNS'])) {
				word = nounInflector.singularize(word);
			}

		    var partOfSpeech = taggedWords[i][1];
		    if (R.contains(partOfSpeech, ['NN', 'NNP', 'NNPS', 'NNS'])) {
		    	if (nounHash[word]) {
		    		nounHash[word]++;
		    	} else {
		    		nounHash[word] = 1;
		    	}
		    }
		}

		nounHash = R.toPairs(nounHash);
		var sort = function(a, b) {
			return b[1] - a[1];
		}

		var sortedNouns = R.sort(sort, nounHash);

		for (var i=0; i<11; i++) {
			output[i] = sortedNouns[i];
		}

		res.json({
		  	frequentWords: output,
		});
	});
});

var server = app.listen(9000, function () {
  var host = server.address().address;
  var port = server.address().port;
});