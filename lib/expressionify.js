'use strict';

// default operand pattern
var defaultOperandPattern = '[A-Za-z\\d\\_]+';

var validateParams = function(params, requiredParams) {
	if (!params) {
		throw new Error('params is missing');
	}

	requiredParams.forEach(function(name) {
		if (!params[name]) {
			throw new Error('params.' + name + ' is missing');
		}
	});
};

// retrun regexp pattern for operans, operators and brackets
var buildTokenPattern = function(params) {
	var patterns = [];
	patterns.push(params.operandPattern);

	// add operators patterns
	for (var key in params.operators) {
		// TODO: think about how to escape long operators
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

/**
 * Return revers polish notation view of expression.
 * @param {string} expression
 * @param {object} params
 * * operators {object{object{execute, priority, type}}} - required
 * * operandPattern {string} - regexp pattern to match operands in expression
 * * tokenPattern {string} - regexp pattern to split expression onto tokens.
 * * * By default `tokenPattern` generates via `buildTokenPattern()`
 * @return {array{string}}
 */
var buildRpn = function(expression, params) {
	validateParams(params, ['operators']);

	// prepare params
	params.operandPattern = params.operandPattern || defaultOperandPattern;
	params.tokenPattern = params.tokenPattern || buildTokenPattern(params);

	validateExpression(expression, params);

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
				while (peek(stack) !== '(')
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

/**
 * Evaluate expression in revers polish notation view.
 * @param {string} rpn
 * @param {object} params
 * * operators {object{object{execute, priority, type}}} - required
 * * parseOperand {function} - return operand value to eval operations. Required
 * @return result of expression evaluating
 */
var evaluateRpn = function(rpn, params) {
	validateParams(params, ['operators', 'parseOperand']);

	var stack = [];

	rpn.forEach(function(token) {
		if (token in params.operators) {
			var secondOperand;
			if (params.operators[token].type === 'binary') {
				secondOperand = stack.pop();
			}
			var firstOperand = stack.pop();

			stack.push(params.operators[token].execute(firstOperand, secondOperand));
		} else {
			stack.push(params.parseOperand(token));
		}
	});

	return stack.pop();
};


/**
 * Return evaluator function for expression.
 * @param {string} expression
 * @param {object} params
 * * operators {object{object{execute, priority, type}}} - required
 * * parseOperand {function} - return operand value to make operations
 * * tokenPattern {string} - regexp pattern to split expression onto tokens
 * * operandPattern {string} - regexp pattern to match operands in expression
 * @return {function}
 */
var expressionify = function(expression, params) {
	var rpn = buildRpn(expression, params);

	var evaluate = function(parseOperand) {
		return evaluateRpn(rpn, {
			parseOperand: parseOperand || params.parseOperand,
			operators: params.operators
		});
	};

	return evaluate;
};


exports.buildRpn = buildRpn;
exports.evaluateRpn = evaluateRpn;
exports.expressionify = expressionify;