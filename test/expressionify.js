'use strict';

var expect = require('expect.js');
var expressionify = require('../lib/expressionify');


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


var setOperators = {
	'union': {
		execute: function(x, y) {
			var result = [];
			for (var i in x) {
				result.push(x[i]);
			}
			for (var j in y) {
				if (result.indexOf(y[j]) === -1) {
					result.push(y[j]);
				}
			}
			return result;
		},
		priority: 2,
		type: 'binary'
	},
	'intersect': {
		execute: function(x, y) {
			var result = [];
			for (var i in x) {
				if (y.indexOf(x[i]) !== -1) {
					result.push(x[i]);
				}
			}
			return result;
		},
		priority: 1,
		type: 'binary'
	},
	'diff': {
		execute: function(x, y) {
			var result = [];
			for (var i in x) {
				if (y.indexOf(x[i]) === -1) {
					result.push(x[i]);
				}
			}
			return result;
		},
		priority: 2,
		type: 'binary'
	}
};

var parseSetOperand = function(operand) {
	return operand.replace('{', '').replace('}', '').split(',');
};


describe('expressionify', function() {

	it('module exports function', function() {
		expect(expressionify).a(Function);
	});

	it('module exports Expression class', function() {
		expect(expressionify.Expression).a(Function);
	});

	it('should throw `params.operators is missing` error',
		function() {
			expect(expressionify('1', {})).to.throwException(
				function(err) {
					expect(err.message).to.equal('params.operators is missing');
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
					expect(err.message).to.equal('params.parseOperand is missing');
				}
			);
		}
	);

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
		it('should return ' + test.result + ' for "' + test.expression + '"',
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
		it('should return ' + test.result + ' for "' + test.expression + '"',
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
		it('should return ' + test.result + ' for "' + test.expression + '"',
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
		it('should return ' + test.result + ' for "' + test.expression + '"',
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
		it('should return ' + test.result + ' for "' + test.expression + '"',
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: arithmeticalOperators,
					parseOperand: parseNumberOperand
				});

				expect(evalExpression().toString()).to.be.equal(test.result);
			}
		);
	});

	// test set expressions
	[{
		expression: '{1}',
		result: ['1']
	}, {
		expression: '{1,2} union {1,3}',
		result: ['1', '2', '3']
	}, {
		expression: '{1,2} intersect {1,3}',
		result: ['1']
	}, {
		expression: '({1,2} intersect {1,3}) union {3,4}',
		result: ['1','3','4']
	}, {
		expression: '{1,2} diff {1,2,3}',
		result: []
	}, {
		expression: '{1,2} diff {1,3} intersect {1,2,3,4}',
		result: ['2']
	}].forEach(function(test) {
		it('should return {' + test.result + '} for "' + test.expression + '"',
			function() {
				var evalExpression = expressionify(test.expression, {
					operators: setOperators,
					parseOperand: parseSetOperand
				});

				expect(evalExpression()).to.be.eql(test.result);
			}
		);
	});
});