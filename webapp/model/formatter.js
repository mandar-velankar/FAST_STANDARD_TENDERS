sap.ui.define([
	'sap/ui/core/format/NumberFormat',
	'sap/ui/core/format/DateFormat'
], function (NumberFormat,DateFormat) {
	"use strict";

	const floatInstance = NumberFormat.getFloatInstance({
		maxFractionDigits: 2
	});

	const currencyInstance = NumberFormat.getCurrencyInstance({
		minFractionDigits: 2,
		maxFractionDigits: 2
	});

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
			var oPercentFormat = NumberFormat.getPercentInstance({
				minFractionDigits: 2,
				maxFractionDigits: 2
			});
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

		formatCurrency: function(value, currency, region){
			if (!value && value != 0) return;
			var numberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: region === 'MEA' ? 3 : 2,
				minFractionDigits: region === 'MEA' ? 3 : 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			const roundedValue = parseFloat(value);
			return numberFormat.format(roundedValue) + " " + currency;
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
				case 'taiwanprice'	:
					stringToReplace	= originalString;
					replacementString = "Taiwan Price";
					break;
				case 'taiwandiscount'	:
					stringToReplace	= originalString;
					replacementString = "Taiwan Discount";
					break;
				case 'nldiscount'	:
					stringToReplace	= originalString;
					replacementString = "NL Discount";
					break;
				case 'nlprice'	:
					stringToReplace	= originalString;
					replacementString = "NL Price";
					break;
				default:
					return originalString;
			}
			const regex = new RegExp(stringToReplace, 'gi');
			return originalString.replace(regex, replacementString);
		},

		truncToTwoDecimalPlaces: function(number) {
			const factor = 100; // 10^2 for two decimal places
			const result = Math.round(number * factor) / factor;
    		return result;
		},

		truncToThreeDecimalPlaces: function(number) {
			const factor = 1000; // 10^3 for three decimal places
			const result = Math.round(number * factor) / factor;
			return result;
		},

		truncToFourDecimalPlaces: function(number) {
			const factor = 10000; // 10^4 for four decimal places
			const result = Math.round(number * factor) / factor;
			return result;
		},
		
		formatRequestedQuantity: function (value, uom) {
			if (!value && value != 0) return;
			const numberFormat = NumberFormat.getIntegerInstance({
				maxFractionDigits: 0,
				minFractionDigits: 0, 
				groupingEnabled: true, 
				groupingSeparator: ','
			});
			return `${numberFormat.format(value)} ${uom}`;
		}	
	};
});