sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/DateFormat"
], function (CompositeType,ValidateException,DateFormat) {
    "use strict";

    return CompositeType.extend("com.bayer.tender.claims.model.datatypes.CustomDateType", {

        formatValue: function(oValue) {
            if (!oValue) {
                return ""
            };
            const oDateFormat = DateFormat.getDateInstance({
                    pattern: 'yyyy-MM-dd',
                    UTC: false
                });
                return oDateFormat.format(oValue) ;
        },

        parseValue: function(oValue) {
            if (!oValue) {
                return ""
            };
            const oDateFormat = DateFormat.getDateInstance({
                    pattern: 'dd-MM-yyyy',
                    UTC: false
                });
                return oDateFormat.parse(oValue);

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