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
        this.database = config.database;
        this.dialectOptions = config.dialectOptions
        this.dialectOptionsType = config.dialectOptionsType
        this.logging = config.logging
        this.poolMin = config.poolMin
        this.poolMax = config.poolMax
        this.poolIdle = config.poolIdle
        this.poolAcquire = config.poolAcquire
        this.poolEvict = config.poolEvict
    }
    RED.nodes.registerType("orm-db-connection",Connection);
}
