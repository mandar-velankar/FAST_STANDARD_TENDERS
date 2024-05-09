sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (CompositeType, SimpleType,ValidateException, NumberFormat) {
    "use strict";
    return CompositeType.extend("com.bayer.tender.statenderapp.model.datatypes.CustomNumberType", {

        formatValue: function(parts) {
            const oCurrencyFormat = NumberFormat.getIntegerInstance({
                maxFractionDigits: 0,
                minFractionDigits: 0,
                groupingEnabled:true,
                groupingSeparator: ','
            });
            return parts[2] === 'MEA' || (parts[2] !== 'MEA' && parts[1].toLowerCase().includes('hm')) ? oCurrencyFormat.format(Number(parts[0] ?? 0)) : parts[0] ;
        },

        parseValue: function(number) {
            return number;
        },

        validateValue: function(number) {

            if(!(/^\+?[0-9]\d*$/.test(number))) {
                throw new ValidateException("Not a valid number");
            }
        }

    });
});