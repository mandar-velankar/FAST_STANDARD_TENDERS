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
            const countryGroupingSeparators = {
                'NL': '.',
                'PL': ' '
            }

            const countryDecimalSeparators = {
                'NL': ',',
                'PL': ','
            }

            const oCurrencyFormat = NumberFormat.getCurrencyInstance({
                    minFractionDigits: parts[3] === 'ES' ? 6 : parts[3]?.includes('HM') ? 4 : parts[2] === 'MEA' ? 3 : 2,
                    maxFractionDigits: parts[3] === 'ES' ? 6 : parts[3]?.includes('HM') ? 4 : parts[2] === 'MEA' ? 3 : 2,
                    groupingSeparator: countryGroupingSeparators[parts[3]] ? countryGroupingSeparators[parts[3]] : ",",
                    decimalSeparator: countryDecimalSeparators[parts[3]] ? countryDecimalSeparators[parts[3]] : "."
                });
			return `${oCurrencyFormat.format(Number(parts[0] ?? 0))} ${parts[1] ?? ''}` ;
        },

        parseValue: function (oValue) {
            if (!oValue) {
                return null;
            }

            // Remove currency text and spaces
            let sValue = oValue.replace(/[^\d.,\-]/g, "");

            const hasDot = sValue.includes(".");
            const hasComma = sValue.includes(",");

            // Case 1: NL grouped format → 1.798,75
            if (hasDot && hasComma && sValue.lastIndexOf(".") < sValue.lastIndexOf(",")) {
                sValue = sValue
                    .replace(/\./g, "")   // remove grouping dots
                    .replace(",", ".");   // decimal comma → dot
            }
            // Case 2: NL ungrouped decimal → 4,72
            else if (!hasDot && hasComma) {
                sValue = sValue.replace(",", ".");
            }

            const oCurrencyFormat = NumberFormat.getCurrencyInstance();
            const vParsed = oCurrencyFormat.parse(sValue);

            if (vParsed === null) {
                throw new ValidateException("Invalid currency format");
            }

            return vParsed;
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