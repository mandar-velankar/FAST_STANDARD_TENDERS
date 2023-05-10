sap.ui.define([
	'sap/ui/core/format/NumberFormat'
], function (NumberFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		formatPercentage: function(value){
			if(!value) return;
			var oPercentFormat = NumberFormat.getPercentInstance();
			return oPercentFormat.format(value);
		}
	};
});