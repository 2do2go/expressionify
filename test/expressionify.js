'use strict';

var expect = require('expect.js');

var expressionify = require('../lib/expressionify').expressionify;

// boolean operand parser
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

var parseNumberOperand = function(operand) {
	return Number(operand);
};

var arithmeticalOperators = {
	'+': {
		execute: function(x, y) {
			return y !== undefined ? (x + y) : +x;
		},
		priority: {
			binary: 1,
			unary: 3
		}
	},
	'-': {
		execute: function(x, y) {
			return y !== undefined ? (x - y) : -x;
		},
		priority: {
			binary: 1,
			unary: 3
		}
	},
	'*': {
		execute: function(x, y) {
			return x * y;
		},
		priority: {
			binary: 2
		}
	},
	'/': {
		execute: function(x, y) {
			return x / y;
		},
		priority: {
			binary: 2
		}
	},
	'%': {
		execute: function(x, y) {
			return x % y;
		},
		priority: {
			binary: 2
		}
	}
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

	[{
		expression: 'x + y',
		result: 5
	}, {
		expression: '-x*-x',
		result: 4
	}, {
		expression: '2*x*x + 4*x - 3',
		result: 13
	}, {
		expression: '7*x - 3*y*x + 3*-x',
		result: -10
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var values = {
					x: 2,
					y: 3
				};

				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators
				});

				expect(evalExpression(function(operand) {
					return operand in values ? values[operand] : Number(operand);
				})).to.be.eql(test.result);
			}
		);
	});

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
		expression: '-(2+2)',
		result: -4
	}, {
		expression: '5 * -3',
		result: -15
	}, {
		expression: '5 % 3',
		result: 2
	}].forEach(function(test) {
		it('should return ' + test.result + ' for ' + test.expression,
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators,
					parseOperand: parseNumberOperand
				});

				expect(evalExpression()).to.be.eql(test.result);
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

	it('should throw `parseOperand is missing` error',
		function() {
			var evalExpression = expressionify('1');

			expect(evalExpression).to.throwException(
				function(err) {
					expect(err.toString()).to.eql('Error: parseOperand is missing');
				}
			);
		}
	);
});