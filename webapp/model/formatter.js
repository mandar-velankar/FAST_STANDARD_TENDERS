sap.ui.define([
	'sap/ui/core/format/NumberFormat',
	'sap/ui/core/format/DateFormat'
], function (NumberFormat,DateFormat) {
	"use strict";

	const floatInstance = NumberFormat.getFloatInstance({
		maxFractionDigits: 2
	});

	const currencyInstance = NumberFormat.getCurrencyInstance();

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue, currency) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2) + " " + currency;
		},

		formatPercentage: function(value){
			if(!value) return;
			var oPercentFormat = NumberFormat.getPercentInstance();
			return oPercentFormat.format(value);
		},

		formatFloat: function(value){
			if(!value) return;
			return floatInstance.format(value);
		},

		parseFloat: function(value){
			if(!value) return;
			return floatInstance.parse(value);
		},

		formatCurrency: function(value){
			return currencyInstance.format(value);
		},

		parseCurrency: function(value){
			if(!value) return;
			return currencyInstance.parse(value);
		},

		formatDate: function(date, pattern){
			return DateFormat.getDateInstance({pattern: pattern, UTC: true}).format(date);
		},

		parseDate: function(date, pattern){
			return DateFormat.getDateInstance({pattern: pattern, UTC: true}).parse(date);
		},

		formatText: function (value) {
			return parseInt(value);
		},
		toUpperCamelCase: function(str) {
			return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
		},

		replaceString: function (originalString) {
			let stringToReplace,replacementString;
			switch(originalString.toLocaleLowerCase()){
				case 'pricewithfoc'	:
					stringToReplace	= originalString;
					replacementString = "Price with FOC";
					break;
				case 'discountwithfoc'	:
					stringToReplace	= originalString;
					replacementString = "Discount with FOC";
					break;
				default:
					return originalString;
			}
			const regex = new RegExp(stringToReplace, 'gi');
			return originalString.replace(regex, replacementString);
		},

		truncToTwoDecimalPlaces: function(number) {
			const factor = 100; // 10^2 for two decimal places
			return Math.trunc(number * factor) / factor;
		}
	};
});