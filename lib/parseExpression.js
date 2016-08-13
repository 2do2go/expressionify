'use strict';

var utils = require('./utils');

var expressionRules = {
	'start': ['operand', '(', 'unary'],
	'unary': ['operand', '(', 'unary'],
	'binary': ['operand', '(', 'unary'],
	'(': ['operand', 'unary', '('],
	')': ['binary', ')', 'end'],
	'operand': ['binary', ')', 'end'],
	'end': []
};

var specialSymbols = '{}[]$^/*+-%:&|';
var specialSymbolRegexp = new RegExp(
	'(\\' + specialSymbols.split('').join('|\\') + ')', 'g'
);

var createNextTokenGetter = function(params) {
	// escape special symbols in operators
	var operators = [];
	for (var operator in params.operators) {
		operators.push(
			operator.replace(specialSymbolRegexp, '\\$&')
		);
	}

	// prepare regexps for parsing
	var operatorRegexp = new RegExp('^(' + operators.join('|') + ')');
	var notOperandTokenRegexp = new RegExp(
		'(' + operators.concat(['\\(', '\\)', '\\s', '$']).join('|') + ')'
	);
	var emptyCharRegexp = /\s/;

	// return token at index in expression
	return function(expression, index) {
		var value = '';
		var startIndex = index;

		// return token object
		var createToken = function(type) {
			return {
				value: value,
				type: type,
				startIndex: startIndex,
				currentIndex: index
			};
		};

		// skip empty space
		while (expression.length > index &&
			emptyCharRegexp.test(expression.charAt(index))
		) {
			index += 1;
		}
		startIndex = index;

		// check for expression end
		if (expression.length === index) {
			return createToken('end');
		}

		// get first character of token
		value = expression.charAt(index++);

		// check for brackets
		if (value === '(' || value === ')') {
			return createToken(value);
		}

		// check for operator
		var operatorMatches = operatorRegexp.exec(value + expression.substr(index));
		if (operatorMatches && operatorMatches.length > 0) {
			value = operatorMatches[0];
			index += value.length - 1;
			return createToken(params.operators[value].type);
		}

		// cause current token is operand
		// search for next not operand token, empty space or expression end
		var operandEndIndex = expression.substr(index).search(notOperandTokenRegexp);
		if (operandEndIndex === -1) {
			throw new Error('unexpected parse error at position ', index);
		}
		value = value + expression.substr(index, operandEndIndex);
		index += operandEndIndex;
		return createToken('operand');
	};
};

module.exports = function(expression, params) {
	if (!expression || /^\s*$/.test(expression)) {
		throw new Error('expression is missing');
	}

	var getNextToken = createNextTokenGetter(params);
	var bracketsCounter = 0;
	var tokens = [{
		type: 'start'
	}];

	// parse expression
	var currentToken = getNextToken(expression, 0);
	while (currentToken.type !== 'end') {
		// check if current token can be after previous follow
		if (
			expressionRules[utils.peek(tokens).type].indexOf(currentToken.type) === -1
		) {
			throw new Error(
				'unexpected token "' + currentToken.value + '" at position ' +
				(currentToken.startIndex + 1)
			);
		}

		// update brackets counter
		if (currentToken.type === '(') bracketsCounter++;
		if (currentToken.type === ')') bracketsCounter--;

		tokens.push(currentToken);
		currentToken = getNextToken(expression, currentToken.currentIndex);
	}

	// check for unexpected end of expression
	if (
		expressionRules[utils.peek(tokens).type].indexOf(currentToken.type) === -1
	) {
		throw new Error('unexpected end of expression');
	}

	// check brackets counter
	if (bracketsCounter !== 0) {
		throw new Error(
			'unexpected end of expression: lost ' +
			((bracketsCounter < 0) ? 'opening' : 'closing') +
			' bracket' + ((bracketsCounter*bracketsCounter > 1) ? 's' : '')
		);
	}

	// get tokens value
	var values = [];
	tokens.splice(1).forEach(function(token) {
		values.push(token.value);
	});
	return values;
};