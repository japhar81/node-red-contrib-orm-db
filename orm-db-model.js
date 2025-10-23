const { Sequelize } = require('sequelize');

module.exports = function(RED) {
    function DbModel(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.server = RED.nodes.getNode(config.server);
        this.fields = config.fields;
        this.table = config.table;
        this.relationship = config.relationship;
        let node = this;

        if(this.server){
            const sequelizeInstance = createSequelizeInstance(this.server)
            sequelizeInstance.authenticate()
            .then(x=>{
                node.status({ fill: "green", shape: "ring", text: "Connected" });
            })
            .catch(e=>{
                node.status({ fill: "red", shape: "ring", text: `Error` });
            })
        }
    }
    RED.nodes.registerType("orm-db-model", DbModel);
    RED.httpAdmin.get("/orm-db-model-nodes", function(req, res) {
        var configNodes = [];
        RED.nodes.eachNode(function(node) {
            if (node.type === "orm-db-model") {
                configNodes.push(node);
            }
        });
        res.json(configNodes);
    });

    function createSequelizeInstance(server){
        // Pool configuration
        const poolConfig = {
            min: server.poolMin !== undefined ? parseInt(server.poolMin) : 0,
            max: server.poolMax !== undefined ? parseInt(server.poolMax) : 5,
            idle: server.poolIdle !== undefined ? parseInt(server.poolIdle) : 10000,
            acquire: server.poolAcquire !== undefined ? parseInt(server.poolAcquire) : 60000,
            evict: server.poolEvict !== undefined ? parseInt(server.poolEvict) : 1000
        }
        
        return server.driver == 'sqlite' ? new Sequelize({
                    dialect: server.driver,
                    storage: server.database,
                    dialectOptions: server.dialectOptions ? JSON.parse(server.dialectOptions) : {},
                    pool: poolConfig
                }) : new Sequelize(server.database, server.username, server.password, {
                    host: server.host,
                    dialect: server.driver,
                    dialectOptions: server.dialectOptions ? JSON.parse(server.dialectOptions) : {},
                    pool: poolConfig
                })
    }
    
}