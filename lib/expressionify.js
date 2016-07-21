'use strict';

// default boolean operators
var booleanOperators = exports.booleanOperators = {
	'|': {
		execute: function(x, y) { return x || y; },
		priority: {
			binary: 1
		}
	},
	'&': {
		execute: function(x, y) { return x && y; },
		priority: {
			binary: 2
		}
	},
	'!': {
		execute: function(x) { return !x; },
		priority: {
			unary: 3
		}
	}
};

// default operand pattern
var defaultOperandPattern = '[A-Za-z\\d\\_]+';

// token type to store value and operator type and priority
var Token = function(value) {
	this.value = value;

	// type is `unary` or `binary` for operators and `null` for other tokens
	this.type = null;
	this.priority = null;
};

// retrun regexp pattern for operans, operators and brackets
var buildTokenPattern = function(params) {
	var patterns = [];
	patterns.push(params.operandPattern);

	// add operators patterns
	for (var key in params.operators) {
		// todo: think about long operators
		patterns.push('\\' + key);
	}

	patterns.push('\\(');
	patterns.push('\\)');

	return '(' + patterns.join('|') + ')';
};

// check if expression 
var validateExpression = function(expression, params) {
	if (!expression || !expression.length) {
		throw new Error('expression is missing');
	}

	var expressionRegexp = new RegExp([
		'^', '(\\s*', params.tokenPattern, '\\s*)+', '$'
	].join(''));
	if (!expressionRegexp.test(expression)) {
		throw new Error('expression is invalid');
	}
};

// return rpn view of expression
var buildRpn = exports.buildRpn = function(expression, params) {
	// prepare params
	params = params || {};
	params.operators = params.operators || booleanOperators;
	params.operandPattern = params.operandPattern || defaultOperandPattern;
	params.tokenPattern = buildTokenPattern(params);

	validateExpression(expression, params);

	var peek = function(a) {
		return a[a.length - 1];
	};

	var stack = [];
	var operators = params.operators;
	var tokens = expression.match(new RegExp(params.tokenPattern, 'g'))
		.map(function(value) {
			return new Token(value);
		});

	return tokens
		.reduce(function(output, token, index) {
			var value = token.value;

			if (value in operators) {
				// check if operator is unary or binary
				token.type = (index === 0 || tokens[index - 1].value in operators ||
					tokens[index - 1].value === '(') ? 'unary' : 'binary';
				token.priority = operators[value].priority[token.type];

				while (
					peek(stack) && peek(stack).value in operators &&
					(
						token.type === 'binary' ?
						token.priority <= peek(stack).priority :
						token.priority < peek(stack).priority
					)
				) {
					output.push(stack.pop());
				}
				stack.push(token);
			} else if (value === '(') {
				stack.push(token);
			} else if (value === ')') {
				while (peek(stack) && peek(stack).value !== '(')
					output.push(stack.pop());
				stack.pop();
			} else {
				// if token is operand
				output.push(token);
			}

			return output;
		}, [])
		.concat(stack.reverse());
};

// return result of evaluated rpn expression
var evaluateRpn = exports.evaluateRpn = function(rpn, params) {
	if (!params || !params.parseOperand) {
		throw new Error('parseOperand is missing');
	}

	params.operators = params.operators || booleanOperators;

	var stack = [];

	rpn.forEach(function(token) {
		var value = token.value;

		if (value in params.operators) {
			var secondOperand;
			if (token.type === 'binary') {
				secondOperand = stack.pop();
			}
			var firstOperand = stack.pop();

			stack.push(params.operators[value].execute(firstOperand, secondOperand));
		} else {
			stack.push(params.parseOperand(value));
		}
	});

	return stack.pop();
};


/**
 * Build revers polish notation view of expression.
 * @param {string} expression
 * @param {object} params
 * * operators {object{object{execute, priority}}} - hash of operators
 * * parseOperand {function} - retrun operand value or `null` if argument
 * * * is not operand
 * * operandPattern {string} - regexp pattern to match operands in expression
 * @return {function}
 */
exports.expressionify = function(expression, params) {
	params = params || {};

	var rpn = buildRpn(expression, params);

	var evaluate = function(parseOperand) {
		return evaluateRpn(rpn, {
			parseOperand: parseOperand || params.parseOperand,
			operators: params.operators || booleanOperators
		});
	};
	evaluate.rpn = rpn;

	return evaluate;
};
