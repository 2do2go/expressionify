'use strict';

var expect = require('expect.js');
var expressionify = require('../lib/expressionify').expressionify;


var booleanOperators = {
	'|': {
		execute: function(x, y) { return x || y; },
		priority: 1,
		type: 'binary'
	},
	'&': {
		execute: function(x, y) { return x && y; },
		priority: 2,
		type: 'binary'
	},
	'!': {
		execute: function(x) { return !x; },
		priority: 3,
		type: 'unary'
	}
};

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


var arithmeticalOperators = {
	'+': {
		execute: function(x, y) { return x + y; },
		priority: 1,
		type: 'binary'
	},
	'-': {
		execute: function(x, y) { return x - y; },
		priority: 1,
		type: 'binary'
	},
	'*': {
		execute: function(x, y) { return x * y; },
		priority: 2,
		type: 'binary'
	},
	'/': {
		execute: function(x, y) { return x / y; },
		priority: 2,
		type: 'binary'
	},
	'%': {
		execute: function(x, y) { return x % y; },
		priority: 2,
		type: 'binary'
	}
};

var parseNumberOperand = function(operand) {
	return Number(operand);
};


describe('expressionify', function() {
	// test boolean expressions
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
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: booleanOperators,
					parseOperand: parseBooleanOperand
				});

				expect(evalExpression()).to.be.equal(test.result);
			}
		);
	});

	// test boolean expressions with variables
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

				var evalExpression = expressionify(test.expression, {
					operators: booleanOperators,
					parseOperand: function(operand) {
						return operands.indexOf(operand) !== -1;
					}
				});

				expect(evalExpression()).to.be.equal(test.result);
			}
		);
	});

	// test arithmetical expressions with variables
	[{
		expression: 'x + y',
		result: 5
	}, {
		expression: 'x*x',
		result: 4
	}, {
		expression: '2*x*x + 4*x - 3',
		result: 13
	}, {
		expression: 'x*(4 - 3*y)',
		result: -10
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var values = {
					x: 2,
					y: 3
				};

				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators,
					parseOperand: function(operand) {
						return operand in values ? values[operand] : Number(operand);
					}
				});

				expect(evalExpression()).to.be.equal(test.result);
			}
		);
	});

	// test arithmetical expressions
	[{
		expression: '2',
		result: 2
	}, {
		expression: '2 + 2',
		result: 4
	}, {
		expression: '2*3 + 4',
		result: 10
	}, {
		expression: '18 / 3 * 2',
		result: 12
	}, {
		expression: '18 / (3 * 2)',
		result: 3
	}, {
		expression: '5 % 3',
		result: 2
	}, {
		expression: '1 / 0',
		result: Infinity
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators,
					parseOperand: parseNumberOperand
				});

				expect(evalExpression()).to.be.equal(test.result);
			}
		);
	});

	[{
		expression: '10 + not_a_number',
		result: 'NaN'
	}, {
		expression: 'Infinity / Infinity',
		result: 'NaN'
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators,
					parseOperand: parseNumberOperand
				});

				expect(evalExpression().toString()).to.be.equal(test.result);
			}
		);
	});


	it('should throw `expression is missing` error cause expresion is `undefined`',
		function() {
			expect(expressionify).withArgs(undefined, {
				operators: arithmeticalOperators
			}).to.throwException(function(err) {
				expect(err.toString()).to.equal('Error: expression is missing');
			});
		}
	);

	it('should throw `expression is missing` error cause expression is empty',
		function() {
			expect(expressionify).withArgs('', {
				operators: arithmeticalOperators
			}).to.throwException(function(err) {
				expect(err.toString()).to.equal('Error: expression is missing');
			});
		}
	);

	it('should throw `expression is invalid` error',
		function() {
			expect(expressionify).withArgs('invalid:~', {
				operators: arithmeticalOperators
			}).to.throwException(
				function(err) {
					expect(err.toString()).to.equal('Error: expression is invalid');
				}
			);
		}
	);

	it('should throw `params is missing` error',
		function() {
			expect(expressionify).to.throwException(
				function(err) {
					expect(err.toString()).to.equal('Error: params is missing');
				}
			);
		}
	);

	it('should throw `params.operators is missing` error',
		function() {
			expect(expressionify).withArgs('1', {}).to.throwException(
				function(err) {
					expect(err.toString()).to.equal('Error: params.operators is missing');
				}
			);
		}
	);

	it('should throw `params.parseOperand is missing` error',
		function() {
			var evalExpression = expressionify('1', {
				operators: arithmeticalOperators
			});

			expect(evalExpression).to.throwException(
				function(err) {
					expect(err.toString()).to.equal('Error: params.parseOperand is missing');
				}
			);
		}
	);
});