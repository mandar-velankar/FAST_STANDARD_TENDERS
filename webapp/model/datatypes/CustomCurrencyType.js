sap.ui.define([
    "sap/ui/model/CompositeType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/routing/HashChanger",
], function (CompositeType,ValidateException,NumberFormat, HashChanger) {
    "use strict";

    this.countryCode = '';
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

            const options = {
                minFractionDigits: parts[3] === 'ES' ? 6 : parts[3]?.includes('HM') ? 4 : parts[2] === 'MEA' ? 3 : 2,
                maxFractionDigits: parts[3] === 'ES' ? 6 : parts[3]?.includes('HM') ? 4 : parts[2] === 'MEA' ? 3 : 2,
                groupingSeparator: countryGroupingSeparators[parts[3]] ? countryGroupingSeparators[parts[3]] : ",",
                decimalSeparator: countryDecimalSeparators[parts[3]] ? countryDecimalSeparators[parts[3]] : ".",
            };

            if (parts[4] && parts[4] === "AIP") {
                options.roundingMode = 'TOWARDS_ZERO'
            }

            const oCurrencyFormat = NumberFormat.getCurrencyInstance(options);
			return `${oCurrencyFormat.format(Number(parts[0] ?? 0))} ${parts[1] ?? ''}` ;
        },

        parseValue: function (oValue) {
            this.getCountryCode();

            if (!oValue) {
                return null;
            }

            const countryGroupingSeparators = {
                NL: '.',
                PL: ' '
            };

            const countryDecimalSeparators = {
                NL: ',',
                PL: ','
            };

            const oCurrencyFormat = NumberFormat.getCurrencyInstance({
                groupingSeparator: countryGroupingSeparators[this.countryCode] ?? ",",
                decimalSeparator: countryDecimalSeparators[this.countryCode] ?? "."
            });

            const vParsed = oCurrencyFormat.parse(oValue);

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

        getCountryCode: function () {
            if (HashChanger) {
                const host = window.location.host;
                const hash = HashChanger.getInstance().getHash();
                const countryCodeIndex = !host.includes("localhost") && !host.includes("port") ? 3 : 1;
                this.countryCode = hash ? hash.split('/')?.[countryCodeIndex] : "";
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