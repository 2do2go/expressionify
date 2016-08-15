'use strict';

exports.isObject = function(object) {
	var type = typeof object;

	return type === 'function' || type === 'object' && !!object;
};

exports.extend = function(destanation, source) {
	for (var key in source) {
		destanation[key] = source[key];
	}

	return destanation;
};

exports.peek = function(array) {
	return array[array.length - 1];
};