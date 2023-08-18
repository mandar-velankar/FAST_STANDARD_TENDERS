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
        onChangeOutcome: function (event, StandardSingletonService) {
            const source = event.getSource();
            const reasonItemBinding = source.getParent().getParent().getAggregation("formElements").find(el => el.getAggregation("label") === "Reason").getAggregation("fields")[0].getBinding("items");
            this.setOutcome(source.getSelectedKey());
            reasonItemBinding.aApplicationFilters = []
            const orFilters = [
				new Filter("Outcome",FilterOperator.EQ, source.getSelectedKey())
			]
            reasonItemBinding.filter(orFilters);
        },

        onChangeSample: function (event) {
            const source = event.getSource();
            const itemBinding = source.getParent().getParent().getAggregation("formElements")?.find(el => el.getAggregation("label") === "Sample Quantity")?.getAggregation("fields")[0];
            if(itemBinding){
                source.getSelectedKey() === 'No' || source.getSelectedKey() == '' ? itemBinding.setProperty("enabled", false) : itemBinding.setProperty("enabled", true);
            }     
        },

        onChangeProductIncluded: function (event) {
            const source = event.getSource();
            const itemBinding = source.getParent().getParent().getAggregation("formElements")?.find(el => el.getAggregation("label") === "Decline Comment")?.getAggregation("fields")[0];
            if(itemBinding){
                source.getSelectedKey() === '1'? itemBinding.setProperty("enabled", false) : itemBinding.setProperty("enabled", true);
            }
        },

    });

    
    return new StandardSingleton();
});