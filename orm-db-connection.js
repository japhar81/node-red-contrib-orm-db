
module.exports = function(RED) {
    function Connection(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.driver = config.driver;
        this.host = config.host;
        this.port = config.port;
        this.username = config.username;
        this.password = config.password;
        this.database = config.database;
    }
    RED.nodes.registerType("orm-db-connection",Connection);
}