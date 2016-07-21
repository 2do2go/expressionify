'use strict';

// Utils

var isObject = function(object) {
	var type = typeof object;
	return type === 'function' || type === 'object' && !!object;
};

var extend = function(destanation, source) {
	for (var key in source) {destanation[key] = source[key];}
	return destanation;
};

// Main class

function Expression(expression, params) {
	this._rpn = this._buildRpn(expression, params);
}

// default operand pattern
Expression.prototype._defaultOperandPattern = '[A-Za-z\\d\\_]+';

Expression.prototype._validateParams = function(params, requiredParams) {
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
Expression.prototype._buildTokenPattern = function(params) {
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
Expression.prototype._validateExpression = function(expression, params) {
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

Expression.prototype._buildRpn = function(expression, params) {
	this._validateParams(params, ['operators']);

	// prepare params
	params.operandPattern = params.operandPattern || this._defaultOperandPattern;
	params.tokenPattern = params.tokenPattern || this._buildTokenPattern(params);

	this._validateExpression(expression, params);

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

Expression.prototype.evaluate = function(params) {
	this._validateParams(params, ['operators', 'parseOperand']);

	var stack = [];

	this._rpn.forEach(function(token) {
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

Expression.prototype.toJSON = function() {
	return this._rpn;
};

module.exports = function(expression, params) {

	if (isObject(expression)) {
		params = expression;
		expression = undefined;
	}

	var evaluate = function(evalExpression, evalParams) {

		if (isObject(evalExpression)) {
			evalParams = evalExpression;
			evalExpression = undefined;
		}

		var mixedParams = extend(
			extend({}, params), evalParams
		);

		return new Expression(evalExpression || expression, mixedParams).evaluate(
			mixedParams
		);
	};

	return evaluate;
};

exports = module.exports;

exports.Expression = Expression;
