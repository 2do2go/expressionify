'use strict';

// default boolean operators
var booleanOperators = exports.booleanOperators = {
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

// default operand pattern
var defaultOperandPattern = '[A-Za-z\\d\\_]+';

/**
 * Build revers polish notation view of expression.
 * @param {string} expression
 * @param {object} params
 * * operators {object{object{execute, priority, type}}} - hash of operators
 * * parseOperand {function} - retrun operand value or `null` if argument
 * * * is not operand
 * * operandPattern {string} - regexp pattern to match operands in expression
 * @return {function}
 */
exports.expressionify = function(expression, params) {
	// prepare params
	params = params || {};
	params.operators = params.operators || booleanOperators;
	params.operandPattern = params.operandPattern || defaultOperandPattern;
	params.tokenPattern = _buildTokenPattern(params);

	_validateExpression(expression, params);
	var postfix = _buildRpn(expression, params);

	var evaluate = function(parseOperand) {
		return _evaluate(postfix, {
			parseOperand: parseOperand || params.parseOperand,
			operators: params.operators
		});
	};
	evaluate.postfix = postfix;

	return evaluate;
};

// return rpn view of expression
var _buildRpn = function(expression, params) {
	var peek = function(a) {
		return a[a.length - 1];
	};

	var stack = [];
	var operators = params.operators;
	var tokens = expression.match(new RegExp(params.tokenPattern, 'g'));

	return tokens
		.reduce(function(output, token) {
			if (token in operators) {
				while (
					peek(stack) in operators &&
					(
						operators[token].type === 'binary' ?
						operators[token].priority <= operators[peek(stack)].priority :
						operators[token].priority < operators[peek(stack)].priority
					)
				) {
					output.push(stack.pop());
				}
				stack.push(token);
			} else if (token === '(') {
				stack.push(token);
			} else if (token === ')') {
				while (peek(stack) != '(')
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

// retrun regexp pattern for operans, operators and brackets
var _buildTokenPattern = function(params) {
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
var _validateExpression = function(expression, params) {
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

// evaluate expression in postfix 
var _evaluate = function(postfix, params) {
	var stack = [];

	postfix.forEach(function(token) {
		if (token in params.operators) {
			var y;
			if (params.operators[token].type !== 'unary') {
				y = stack.pop();
			}
			var x = stack.pop();

			stack.push(params.operators[token].execute(x, y));
		} else {
			stack.push(params.parseOperand(token));
		}
	});

	return stack.pop();
};
