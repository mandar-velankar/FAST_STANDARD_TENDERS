sap.ui.define([
  "../BaseObject", 
  "sap/ui/model/Filter",
  "sap/ui/core/Item",
	"sap/gantt/shape/Path"
], function (BaseObject,
	Filter,
  Item,
	Path) {
    return BaseObject.extend("com.bayer.tender.statenderapp.model.template.StaticValue", {
      constructor: function (data) {
        BaseObject.prototype.constructor.call(this);
        if (data) {
          this.id = data.ID;
          this.path = data.Path;
          this.key = data.KeyID;
          this.text = data.ValueText;
        }
      },

      getJSON: function () {
        return {
          ID: this.id,
          Path: this.path,
          KeyID: this.key,
          ValueID: this.value
        };
      },
    
      generateItem: function () {
        let key = this.key;
        let text = this.text;
        return new Item({'key': key, 'text': text});
      },

      _resolveBinding: function({defaultModel,defaultEntityPath,stateModel}, value){
        let model = defaultModel;
        if(this.path.toLowerCase().includes("countrycode")){
          model = stateModel;
          return model.getProperty(`/${value}`);
        }
        return model.getProperty(`${defaultEntityPath}/${value}`);
      }
    });
  });