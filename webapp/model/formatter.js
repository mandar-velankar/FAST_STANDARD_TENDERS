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
			if(!value) return;
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
		}
	};
});