
module.exports = function(RED) {
    function DbModel(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.fields = config.fields;
        this.table = config.table;
        this.relationship = config.relationship;
    }
    RED.nodes.registerType("orm-db-model", DbModel);
}