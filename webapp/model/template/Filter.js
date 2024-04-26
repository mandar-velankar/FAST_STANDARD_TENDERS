sap.ui.define([
  "../BaseObject", 
  "sap/ui/model/Filter",
	"sap/gantt/shape/Path"
], function (BaseObject,
	Filter,
	Path) {
    return BaseObject.extend("com.bayer.tender.statenderapp.model.template.Filter", {
      constructor: function (data) {
        BaseObject.prototype.constructor.call(this);
        if (data) {
          this.id = data.ID;
          this.path = data.Path;
          this.operator = data.Operator;
          this.value1 = data.Value1;
          this.value2 = data.Value2;
        }
      },

      getJSON: function () {
        return {
          ID: this.id,
          Path: this.path,
          Operator: this.operator,
          Value1: this.value1,
          Value2: this.value2
        };
      },
    
      generateFilter: function (modelInfo) {
        if (this.value2) {
          const filters = [
            new Filter({path: this.path, operator: this.operator, value1: this._resolveBinding(modelInfo,this.value1)}),
            new Filter({path: this.path, operator: this.operator, value1: this._resolveBinding(modelInfo,this.value2)})
          ]
          return new Filter(filters, true);
        }
        return new Filter(this.path, this.operator, this._resolveBinding(modelInfo,this.value1), this._resolveBinding(modelInfo,this.value2) );
      },

      _resolveBinding: function({defaultModel,defaultEntityPath,stateModel}, value){
        let model = defaultModel;
        if(this.path.toLowerCase().includes("countrycode")){
          model = stateModel;
          return model.getProperty(`/${value}`);
        }

        if (value.toLowerCase().includes("stmodelfield")) {
          model = stateModel;
          return model.getProperty(`/${value}`);
        }

        return model.getProperty(`${defaultEntityPath}/${value}`);
      }
    });
  });