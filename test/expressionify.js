'use strict';

var expect = require('expect.js');

var expressionify = require('../lib/expressionify').expressionify;

// default boolean operand parser
var parseBooleanOperand = function(operand) {
	var value = null;
	if (operand === 'true' || operand === '1') {
		value = true;
	}
	if (operand === 'false' || operand === '0') {
		value = false;
	}

	return value;
};

describe('expressionify', function() {
	[{
		expression: '1 | 1 & 0',
		result: true
	}, {
		expression: '1 & 0 | 0',
		result: false
	}, {
		expression: '(1 | 0) & 1',
		result: true
	}, {
		expression: '(1 | 0) & (0 & 1)',
		result: false
	}, {
		expression: '(1 | 0 | 1) | (0 & 1)',
		result: true
	}, {
		expression: '!1',
		result: false
	}, {
		expression: '!1 | 1',
		result: true
	}, {
		expression: '!0 | !1 | 1',
		result: true
	}, {
		expression: '!0 & !0',
		result: true
	}, {
		expression: '!(1)',
		result: false
	}, {
		expression: '!(1 & 0)',
		result: true
	}, {
		expression: '!!(1 & 0)',
		result: false
	}, {
		expression: '!!1',
		result: true
	}, {
		expression: '!!!!1',
		result: true
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var evalExpression = expressionify(test.expression);
				expect(evalExpression(parseBooleanOperand)).to.be.eql(test.result);
			}
		);
	});
});