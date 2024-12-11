sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (CompositeType,ValidateException, NumberFormat) {
    "use strict";
    return CompositeType.extend("com.bayer.tender.statenderapp.model.datatypes.CustomNumberType", {

        formatValue: function(parts) {
            if(!parts){
                return "";
            }
            const countryGroupingSeparators = {
                'PL': ' '
            }
            const oCurrencyFormat = NumberFormat.getIntegerInstance({
                maxFractionDigits: 0,
                minFractionDigits: 0,
                groupingEnabled:true,
                groupingSeparator: countryGroupingSeparators[parts[1]] ? countryGroupingSeparators[parts[1]] : ","
            });
            return parts[2] === 'MEA' || (parts[2] !== 'MEA' && parts[1]?.toLowerCase()?.includes('hm'))|| parts[1] === 'PL' ? oCurrencyFormat.format(Number(parts[0] ?? 0)) : parts[0] ;
        },

        parseValue: function(number) {
            return [number];
        },

        validateValue: function(number) {

            // if(!(/^\+?[0-9]\d*$/.test(number))) {
            //     throw new ValidateException("Not a valid number");
            // }
        }

    });
});