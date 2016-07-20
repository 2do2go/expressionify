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

	[{
		expression: 'op1',
		result: true
	}, {
		expression: 'op1 & op2 & op3',
		result: true
	}, {
		expression: 'op1 & nop1',
		result: false
	}, {
		expression: '(op1 | op2) & nop1',
		result: false
	}, {
		expression: '(op1 | nop1) & op2',
		result: true
	}, {
		expression: '(op1 | nop1) & (!op2 | !nop2)',
		result: true
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var operands = ['op1', 'op2', 'op3'];

				var evalExpression = expressionify(test.expression);

				expect(evalExpression(function(operand) {
					return operands.indexOf(operand) !== -1;
				})).to.be.eql(test.result);
			}
		);
	});

	it('should throw `expression is missing` error',
		function() {
			expect(expressionify).to.throwException(function(err) {
				expect(err.toString()).to.eql('Error: expression is missing');
			});
		}
	);

	it('should throw `expression is missing` error',
		function() {
			expect(expressionify).withArgs('').to.throwException(function(err) {
				expect(err.toString()).to.eql('Error: expression is missing');
			});
		}
	);

	it('should throw `expression is invalid` error',
		function() {
			expect(expressionify).withArgs('invalid:~').to.throwException(
				function(err) {
					expect(err.toString()).to.eql('Error: expression is invalid');
				}
			);
		}
	);
});