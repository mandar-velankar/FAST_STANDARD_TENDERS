sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Object, Filter, FilterOperator) {
    "use strict";
    var StandardSingleton = Object.extend("namespace.service.StandardSingleton", {
        constructor: function () {
            Object.prototype.constructor.call(this);
            this.countryCode = "";
            this.outcome = "";
        },
        setCountryCode: function(sCountryCode){
            this.countryCode = sCountryCode;
        },

        getCountryCode: function(){
            return this.countryCode;
        },

        setOutcome: function (outcome) {
            this.outcome = outcome;
        },

        getOutcome: function () {
            return this.outcome;
        },
        onChangeOutcome: function (event) {
            const reasonItemBinding = this.getParent().getParent().getAggregation("formElements").find(el => el.getAggregation("label") === "Reason").getAggregation("fields")[0].getBinding("items");
            reasonItemBinding.aApplicationFilters = []
            const orFilters = [
				new Filter("Outcome",FilterOperator.EQ, this.getSelectedKey())
			]
            reasonItemBinding.filter(orFilters);
        }
    });

    
    return new StandardSingleton();
});