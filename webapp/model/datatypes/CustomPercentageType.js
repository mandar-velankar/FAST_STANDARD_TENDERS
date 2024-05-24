sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (CompositeType,ValidateException,NumberFormat) {
    "use strict";

    /*const oPercentFormat = NumberFormat.getPercentInstance({
        minFractionDigits: 2,
        maxFractionDigits: 2
    });*/

    return CompositeType.extend("com.bayer.tender.statenderapp.model.datatypes.CustomPercentageType", {

        formatValue: function(parts) {
            const oPercentFormat = NumberFormat.getPercentInstance({
                minFractionDigits: parts[1] === 'AU' ? 4 : 2,
                maxFractionDigits: parts[2] === 'AU' ? 4 : 2,
                groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: ".",
                preserveDecimals: true
            });
            return oPercentFormat.format(Number(parts[0] ?? 0));
			//return oPercentFormat.format(Number(value));
        },

        parseValue: function(oValue) {
            let floatNum = parseFloat(oValue); 
            return [floatNum/100];
        },

        validateValue: function(oValue) {
            if(oValue > 1) {
                throw new ValidateException("Not a valid percentage!");
            }
        },

        /**
         * Override
         * see https://sapui5.netweaver.ondemand.com/sdk/#/api/sap.ui.model.SimpleType%23methods/Summary
         * @returns 
         */
        getModelFormat: function(){
            return {
                format: value =>  this.formatValue(value),
                parse: value =>  this.parseValue(value)
            }
        }

    });
});