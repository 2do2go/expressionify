
# expressionify

[![Build Status](https://travis-ci.org/2do2go/expressionify.svg?branch=master)](https://travis-ci.org/2do2go/expressionify)

Simple node.js expression parser and evaluator using shunting-yard and reverse
polish notation algorithms.

`Expressionify` allow to define all operators in expression. Hash of operators
must to contain objects with following fields:

* `execute` - function that evaluate operator action.

* `priority` - operator priority. The higher value the higher priority.

* `type` - operator type - `'unary'` or `'binary'`.

For example, boolean operators will represented as following hash:

```js
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
```

Also you must pass `parseOperand` to evaluate methods. `parseOperand` will be
used to get value of every operand. Operand is a sequence of non-whitespace
characters that is not equal to any operator or bracket.

**Note:** `parseOperand` must return value compatible with defined operators.

For example, see `parseOperand` for boolean expressions:

```js
var parseBooleanOperand = function(operand) {
	if (operand === 'true' || operand === '1') {
		return true;
	} else {
		return false;
	}
};
```


## API

expressionify exposes function which accepts following parameters:

* `expression` *String*

* `params` *Object*

 * `operators` - hash of operators. **Required**.

 * `parseOperand` - function that will be used to parse every operand.

Returns evaluator function which accepts same `expression` and `params`
arguments, that allows to override parameters specified during evaluator
creation.


## Examples

For example, evaluating simple logic expressions using once built evaluator:

```js
var evaluateExpression = expressionify({
	operators: booleanOperators,
	parseOperand: Number
});

var result = evaluateExpression('(1 | 0) & !0');

console.log(result);
// true

result = evaluateExpression('(1 | 0) & !1');

console.log(result);
// false
```

Another example is evaluating expression that contains variables:

```js
var values = {
	x: true,
	y: false,
	z: false
};

var evaluateExpression = expressionify('(x | y) & !z', {
	operators: booleanOperators,
	parseOperand: function(operand) {
		return values[operand];
	}
});

console.log(evaluateExpression());
// true

values.z = true;
console.log(evaluateExpression());
// false
```

For more examples with boolean, arithmetical and set expressions see [./test directory](./test).