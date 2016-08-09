'use strict';

var expect = require('expect.js');
var parseExpression = require('../lib/parseExpression');


var booleanOperators = {
	'|': { type: 'binary' },
	'&': { type: 'binary' },
	'!': { type: 'unary' }
};

describe('parseExpression', function() {

	[
		undefined,
		'',
		'   '
	].forEach(function(expression) {
		it('should throw `expression is missing` error cause expresion is "' +
			expression + '"',
			function() {
				expect(parseExpression).withArgs(
					expression,
					{
						operators: booleanOperators
					}
				).to.throwException(
					function(err) {
						expect(err.message).to.equal('expression is missing');
					}
				);
			}
		);
	});

	[
		'1 1',
		'|',
		')',
		'!|',
		'()',
		'(1)!'
	].forEach(function(expression) {
		it('should throw `unexpected token` error for "' + expression + '"',
			function() {
				expect(parseExpression).withArgs(
					expression,
					{
						operators: booleanOperators
					}
				).to.throwException(
					function(err) {
						expect(err.message).to.match(/^unexpected token/);
					}
				);
			}
		);
	});

	[
		'a | b)',
		'(a | b) & c)'
	].forEach(function(expression) {
		it('should throw `unexpected end of expression` error for "' + expression +
			'" cause lost opening bracket',
			function() {
				expect(parseExpression).withArgs(
					expression,
					{
						operators: booleanOperators
					}
				).to.throwException(
					function(err) {
						expect(err.message).to.match(
							/^unexpected end of expression: lost opening bracket$/
						);
					}
				);
			}
		);
	});

	[
		'(a | b',
		'(c & (a | b)'
	].forEach(function(expression) {
		it('should throw `unexpected end of expression` error for "' + expression +
			'" cause lost closing bracket',
			function() {
				expect(parseExpression).withArgs(
					expression,
					{
						operators: booleanOperators
					}
				).to.throwException(
					function(err) {
						expect(err.message).to.match(
							/^unexpected end of expression: lost closing bracket$/
						);
					}
				);
			}
		);
	});

	[
		'a |',
		'!',
		'('
	].forEach(function(expression) {
		it('should throw `unexpected end of expression` error for "' + expression +
			'"',
			function() {
				expect(parseExpression).withArgs(
					expression,
					{
						operators: booleanOperators
					}
				).to.throwException(
					function(err) {
						expect(err.message).to.match(/^unexpected end of expression$/);
					}
				);
			}
		);
	});

});