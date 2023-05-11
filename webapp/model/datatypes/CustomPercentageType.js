sap.ui.define([
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (SimpleType,ValidateException,NumberFormat) {
    "use strict";

    const oPercentFormat = NumberFormat.getPercentInstance();

    return SimpleType.extend("com.bayer.tender.statenderapp.model.datatypes.CustomPercentageType", {

        formatValue: function(value) {
            // return (oValue * 100).toFixed(2);
			return oPercentFormat.format(value);
        },

        parseValue: function(oValue) {
            var floatNum = parseFloat(oValue.replace(",","."));
            return (floatNum/100);

        },

        validateValue: function(oValue) {

            if(oValue > 1) {
                throw new ValidateException("Not a valid percentage!");
            }
        }

    });
});