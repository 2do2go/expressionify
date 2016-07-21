# expressionify
Simple node.js expression parser and evaluator using shunting-yard and reverse polish notation algorithms.

`Expressionify` allow to define all operators in expression. Hash of operators must to contain objects with following fields:

* `execute` - function that evaluate operator action.

* `priority` - operator priority. The higher value the higher priority.

* `type` - operator type - `'unary'` or `'binary'`.

For example, boolean operators will represented as following hash:

```javascript
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

Also you must pass `parseOperand` to evaluate methods. `parseOperand` will be used to parse every operand. It must return value compatible with defined operators.

For example, see `parseOperand` for boolean expressions:

```javascript
var parseBooleanOperand = function(operand) {
	if (operand === 'true' || operand === '1') {
		return true;
	} else {
		return false;
	}
};
```

## Methods

### `buildRpn`

* `expression` *String*

* `params` *Object*

 * `operators` - hash of operators. **Required**.

 * `operandPattern` - regexp pattern to match operands in expression.

 * `tokenPattern` - regexp pattern to split expression onto tokens.

`buildRpn` parse input `expression` and build revers polish notation view. Returns array of `expression` tokens.

### `evaluateRpn`

* `expression` *String*

* `params` *Object*

 * `operators` - hash of operators. **Required**.

 * `parseOperand` - function that will be used to parse every operand. **Required**.

Evaluate expression in revers polish notation view and return result.

### `expressionify`

* `expression` *String*

* `params` *Object*

 * `operators` - hash of operators. **Required**.

 * `parseOperand` - function that will be used to parse every operand.

 * `operandPattern` - regexp pattern to match operands in expression.

 * `tokenPattern` - regexp pattern to split expression onto tokens.

Return evaluator function for expression. `expressionify` is a simple way to execute one expression several times with different values.

## Example

For example, evaluating boolean expressions:

```javascript
var rpn = buildRpn('(true | false) & false', {
	operators: booleanOperators
};

console.log(evaluateRpn(rpn, {
	parseOperand: parseBooleanOperand
}));
// false
```

Also you may build rpn view of expression and than evaluate it with different values of variables using different `parsePperand` functions:

```javascript
var rpn = buildRpn('(x | y) & !z', {
	operators: booleanOperators
};

console.log(evaluateRpn(rpn, {
	parseOperand: function(operand) {
		var values = {
			x: true,
			y: false,
			z: false
		};

		return values[operand];
	}
}));
// false

console.log(evaluateRpn(rpn, {
	parseOperand: function(operand) {
		var values = {
			x: true,
			y: false,
			z: true
		};

		return values[operand];
	}
}));
// true
```

You may use short variant with `expressionify`:

```javascript
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
};

console.log(evaluateExpression());
// false

values.z = true;
console.log(evaluateExpression());
// true
```