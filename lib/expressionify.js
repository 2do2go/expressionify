'use strict';

var utils = require('./utils');
var parseExpression = require('./parseExpression');


// Main class
function Expression(expression, params) {
	this._rpn = this._buildRpn(expression, params);
}

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

Expression.prototype._buildRpn = function(expression, params) {
	this._validateParams(params, ['operators']);

	var operators = params.operators;
	var tokens = parseExpression(expression, params);

	var rpn = [];
	var stack = [];
	tokens.forEach(function(token) {
		if (token in operators) {
			while (
				utils.peek(stack) in operators &&
				(
					operators[token].type === 'binary' ?
					operators[token].priority <= operators[utils.peek(stack)].priority :
					operators[token].priority < operators[utils.peek(stack)].priority
				)
			) {
				rpn.push(stack.pop());
			}
			stack.push(token);

		} else if (token === '(') {
			stack.push(token);

		} else if (token === ')') {
			while (utils.peek(stack) !== '(') {
				rpn.push(stack.pop());
			}
			stack.pop();

		} else {
			// if token is operand
			rpn.push(token);
		}
	});

	return rpn.concat(stack.reverse());
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

	if (utils.isObject(expression)) {
		params = expression;
		expression = undefined;
	}

	var evaluate = function(evalExpression, evalParams) {

		if (utils.isObject(evalExpression)) {
			evalParams = evalExpression;
			evalExpression = undefined;
		}

		var mixedParams = utils.extend(
			utils.extend({}, params), evalParams
		);

		return new Expression(evalExpression || expression, mixedParams).evaluate(
			mixedParams
		);
	};

	return evaluate;
};

exports = module.exports;

exports.Expression = Expression;
