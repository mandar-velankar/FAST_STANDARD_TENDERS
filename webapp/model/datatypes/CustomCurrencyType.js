sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (CompositeType,ValidateException,NumberFormat) {
    "use strict";

    /*const oCurrencyFormat = NumberFormat.getCurrencyInstance({
        minFractionDigits: 2,
        maxFractionDigits: 2
    });*/

    return CompositeType.extend("com.bayer.tender.statenderapp.model.datatypes.CustomCurrencyType", {

        formatValue: function(parts) {
            if(!parts){
                return "";
            }
            const oCurrencyFormat = NumberFormat.getCurrencyInstance({
                    minFractionDigits: parts[2] === 'MEA' ? 3 : parts[3]?.includes('HM') ? 4 : 2,
                    maxFractionDigits: parts[2] === 'MEA' ? 3 : parts[3]?.includes('HM') ? 4 : 2,
                    groupingSeparator: parts[3] === 'NL' ? "." : ",",
                    decimalSeparator: parts[3] === 'NL' ? "," : "."
                });
			return `${oCurrencyFormat.format(Number(parts[0] ?? 0))} ${parts[1] ?? ''}` ;
        },

        parseValue: function(oValue) {
            const oCurrencyFormat = NumberFormat.getCurrencyInstance({
                // minFractionDigits: 2,
                // maxFractionDigits: 2
            });
            return oCurrencyFormat.parse(oValue);

        },

        validateValue: function(oValue) {
            // if(oValue > 1) {
            //     throw new ValidateException("Not a valid Currency!");
            // }
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