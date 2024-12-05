
const { Sequelize, Model, DataTypes, Op, HasOne } = require('sequelize');
const { v4: uuid } = require('uuid');
let sequelize = {}
let transactions = {}
let time = Date.now()
let databasesCache = null


module.exports = function(RED) {
    function OrmDb(config) {
        RED.nodes.createNode(this,config);
        this.server = RED.nodes.getNode(config.server);
        this.model = RED.nodes.getNode(config.model);
        this.queryType = config.queryType
        this.rawQuery = config.rawQuery
        this.data = config.data
        this.dataType = config.dataType
        this.where = config.where        
        this.attributes = config.attributes;
        this.limitType = config.limitType
        this.limit = config.limit
        this.offsetType = config.offsetType
        this.offset = config.offset
        this.order = config.order
        this.syncType = config.syncType
        let node = this;
        //Si no existe ninguna instancia de Sequelize las creo
        if(!Object.keys(sequelize).length){
            let databases = getDatabaseNodes(RED)
            databases.forEach(async db=>{
                try {
                    sequelize[db.key] = createSequelizeInstance(db.server)                    
                    db.models.forEach(model=>{
                        try {
                            createModelInstance(sequelize[db.key].instance, model)
                            sequelize[db.key].definitionModel[model.table] = model
                        } catch (error) {
                            node.error(`Error in model definition: ${model.table}`, error);
                        }
                    })
                    authenticate(db.key)                                     
                } catch (error) {
                    notifyAuthenticate(db.key, false)
                    node.error(error);
                }
            })
            try {
                createRelationship()
            } catch (error) {
                node.error(error);
            }
            
        }else if(node.queryType == 'table'){//Actualizo los cambios en la conexion o los modelos
            const key = getKeyFromServer(node.server)
            let databases = getDatabaseNodes(RED)
            let modelChange = false
            databases.forEach(async db=>{
                try {
                    //Si la instancia del servidor aun no existe la creo
                    if(!sequelize[db.key]){
                        sequelize[db.key] = createSequelizeInstance(db.server)
                        db.models.forEach(model=>{
                            createModelInstance(sequelize[db.key].instance, model)
                            sequelize[db.key].definitionModel[model.table] = model
                        })
                        modelChange = true
                        authenticate(db.key)
                    } else {
                        // Si la instancia ya existe verifico que si tuvo cambios 
                        const changeServer = ChangeObject(sequelize[db.key].server, db.server)
                        if(changeServer){
                            sequelize[db.key] = createSequelizeInstance(db.server)
                            authenticate(db.key)
                        }
                        db.models.forEach(model=>{
                            if(!sequelize[db.key].instance.models[model.table] || ChangeObject(sequelize[db.key].definitionModel[model.table], model)){
                                createModelInstance(sequelize[db.key].instance, model)
                                sequelize[db.key].definitionModel[model.table] = model
                                modelChange = true
                            }
                        })
                    }
                } catch (error) {
                    node.error(error);
                    notifyAuthenticate(db.key, false)
                }
                
            })
            
            //Elimino las instancias de servidores que ya no se usan
            sequelize = Object.keys(sequelize).reduce((acc,curr)=>{
                if(databases.some(x=> x.key == curr))
                    acc[curr] = sequelize[curr]
                return acc
            }, {})

            if(modelChange){
                try {
                    createRelationship()
                } catch (error) {
                    node.error(error);
                }
            }

            sequelize[key].fnAuthenticate.push(function(authenticate){
                if(authenticate)
                    node.status({ fill: "green", shape: "ring", text: "Connected" });
                else node.status({ fill: "red", shape: "ring", text: `Error` });
            })            
        }
       
        
        node.on('input', async function(msg) {
            try {
                const sequelizeKey = getKeyFromServer(node.server)
                const sequelizeInstance =  sequelize[sequelizeKey].instance         
                const model = node.model ? sequelize[sequelizeKey].instance.models[node.model.table] : null
                switch (node.queryType) {
                    case 'findAll':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        }                        
                        if(node.attributes){
                            options.attributes = node.attributes.split(',')                            
                        }
                        if(node.limitType != 'bool'){
                            options.limit = node.limitType == 'num' ? parseInt(node.limit): getValueByIndex(msg, node.limit)
                        }
                        if(node.offsetType != 'bool'){
                            options.offset = node.offsetType == 'num' ? parseInt(node.offset): getValueByIndex(msg, node.offset)
                        }
                        if(node.order && node.order.length){
                            options.order = node.order
                        }
                        const data = await model.findAll(options)
                        msg.payload = JSON.parse(JSON.stringify(data))
                    }break;
                    case 'findAndCountAll':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        }                        
                        if(node.attributes){
                            options.attributes = node.attributes.split(',')                            
                        }
                        if(node.limitType != 'bool'){
                            options.limit = node.limitType == 'num' ? parseInt(node.limit): getValueByIndex(msg, node.limit)
                        }
                        if(node.offsetType != 'bool'){
                            options.offset = node.offsetType == 'num' ? parseInt(node.offset): getValueByIndex(msg, node.offset)
                        }
                        if(node.order && node.order.length){
                            options.order = node.order
                        }
                        const data = await model.findAndCountAll(options)
                        msg.payload = data
                    }break;
                    case 'add':{
                        let data = {}
                        if( node.dataType != 'bool' ){
                            data = node.dataType == 'json' ? RED.util.evaluateNodeProperty(this.data, 'json', this) : getValueByIndex(msg, this.data)                           
                        }
                        let options = {}
                        if(msg.transaction && transactions[msg.transaction])
                            options.transaction = transactions[msg.transaction]
                        let result = await model.create(data, options)
                        msg.payload = JSON.parse(JSON.stringify(result))
                    }break;
                    case 'update':{
                        let data = {}
                        let options = {}
                        if( node.dataType != 'bool' ){
                            data = node.dataType == 'json' ? RED.util.evaluateNodeProperty(this.data, 'json', this) : getValueByIndex(msg, this.data)                           
                        }
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        }
                        if(msg.transaction && transactions[msg.transaction])
                            options.transaction = transactions[msg.transaction]
                        let result = await model.update(data, options)
                        msg.payload = result
                    }break;
                    case 'delete':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        } 
                        if(msg.transaction && transactions[msg.transaction])
                            options.transaction = transactions[msg.transaction]
                        let result = await model.destroy(options)
                        msg.payload = result
                    }break;
                    case 'findOne':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        }
                        if(node.attributes){
                            options.attributes = node.attributes.split(',')                            
                        }
                        let result = await model.findOne(options)
                        msg.payload = result
                    }break;
                    case 'raw':{
                        const sequelizeKey = `${node.server.driver}-${node.server.host}-${node.server.database}`
                        let options = {}
                        if( node.dataType != 'bool' ){
                            options.replacements = node.dataType == 'json' ? RED.util.evaluateNodeProperty(this.data, 'json', this) : getValueByIndex(msg, this.data)
                        }
                        let result = await sequelizeInstance.query(this.rawQuery, options)
                        msg.payload = result[0]
                    }break;
                    case 'count':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        } 
                        let result = await model.count(options)
                        msg.payload = result
                    }break;
                    case 'max':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        } 
                        let result = await model.max(node.attributes, options)
                        msg.payload = result
                    }break;
                    case 'min':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        } 
                        let result = await model.min(node.attributes, options)
                        msg.payload = result
                    }break;
                    case 'sum':{
                        let options = {}
                        if(node.where && node.where.length){
                            options.where = convertToSequelizeWhere(node.where, msg)
                        } 
                        let result = await model.sum(node.attributes, options)
                        msg.payload = result
                    }break;
                    case 'btransaction':{
                        const t = await sequelizeInstance.transaction();
                        const id = uuid()
                        transactions[id] = t
                        msg.transaction = id
                        setTimeout(() => {//Elimino la transaccion si pasaron 3min
                            if(transactions[id])
                                delete transactions[id]
                        }, 180000);
                    }break;
                    case 'ctransaction':{
                        if(!msg.transaction)
                            throw Error("Transaction ID not found.")
                        if(!transactions[msg.transaction])
                            throw Error("The transaction does not exist.")
                        await transactions[msg.transaction].commit();
                        delete transactions[msg.transaction]
                        delete msg.transaction
                    }break;
                    case 'rtransaction':{
                        if(!msg.transaction)
                            throw Error("Transaction ID not found.")
                        if(!transactions[msg.transaction])
                            throw Error("The transaction does not exist.")
                        await transactions[msg.transaction].rollback();
                        delete transactions[msg.transaction]
                        delete msg.transaction
                    }break;
                    case 'sync':{
                        try {
                            let options = {}
                            if(node.syncType == 'alter' || node.syncType == 'force')
                                options[node.syncType] = true
                            node.status({ fill: 'yellow', shape: 'ring', text: 'Synchronizing' });
                            await sequelizeInstance.sync({ alter: true })
                            node.status({ fill: 'green', shape: 'ring', text: 'Success' });
                        } catch (error) {
                            node.status({ fill: 'red', shape: 'ring', text: 'Error' });
                            throw error;
                            
                        }
                    }break;
                }
                node.send([msg, null]);
            } catch (error) {
                node.error(error);
                node.send([null, msg]);
            }
            
            
            
        });
    }

    

    RED.nodes.registerType("orm-db",OrmDb);
}

function getDatabaseNodes(RED) {
    if((Date.now() - time) <= 1000 && databasesCache)
        return databasesCache
    let result = {}
    RED.nodes.eachNode(function(node){
        if(node.type == 'orm-db' && node.queryType == 'table'){
            const server = RED.nodes.getNode(node.server)
            const key = getKeyFromServer(server)
            if(!result[key]){
                result[key] = {
                    key: key,
                    server: {
                        name: server.name,
                        driver: server.driver,
                        host: server.host,
                        username: server.username,
                        password: server.password,
                        database: server.database
                    },
                    models: []
                }
            }
            const model = RED.nodes.getNode(node.model)
            if(!result[key].models.some(x=> x.table == model.table)){
                result[key].models.push({
                    name: model.name,
                    table: model.table,
                    relationship: model.relationship,
                    fields: model.fields
                })
            }
        }
    })
    databasesCache = Object.values(result)
    setTimeout(x=>{
        time = Date.now()
        databasesCache = null
    }, 1000)
    return databasesCache
}

function getKeyFromServer(server){
    return `${server.driver}-${server.host}-${server.database}`
}


function createSequelizeInstance(server){
    return {
        instance: server.driver == 'sqlite' ? new Sequelize({
                dialect: server.driver,
                storage: server.database
            }) : new Sequelize(server.database, server.username, server.password, {
                host: server.host,
                dialect: server.driver
            }),
        definitionModel: {},
        server: server,
        fnAuthenticate:[]
    }
}

function authenticate(key){
    sequelize[key].instance.authenticate()
        .then(x=>{
            notifyAuthenticate(key, true)
        })
        .catch(e=>{
            notifyAuthenticate(key, false)
        })
}

function createModelInstance(sequelizeInstance,model){
    const fields = model.fields
    const definition = fields.reduce((acc, curr)=>{
        let type = DataTypes[curr.type]
        if(curr.size && curr.type == 'STRING')
            type = DataTypes[curr.type](parseInt(curr.size))
        acc[curr.name] = {
            type: type,
            primaryKey: curr.primary,
            allowNull: curr.allowNull,
            autoIncrement: curr.autoIncrement
        }
        return acc;
    },{})
    sequelizeInstance.define(model.table, definition, { 
        tableName:  model.table,
        timestamps: false
    }) 
}


function createRelationship() {
    
    for(let i in sequelize){
        let models = sequelize[i].definitionModel
        for(let j in models){
            
            models[j].relationship.forEach(r=>{
                let options = r.foreignKey ? { foreignKey: r.foreignKey} : {}
                switch (r.association) {
                    case 'HasOne':{
                        sequelize[i].instance.models[j].hasOne(sequelize[i].instance.models[r.model], options)
                    }break;
                    case 'BelongsTo':{
                        sequelize[i].instance.models[j].belongsTo(sequelize[i].instance.models[r.model], options)
                    }break;
                    case 'HasMany':{
                        sequelize[i].instance.models[j].hasMany(sequelize[i].instance.models[r.model], options)
                    }break;
                    case 'BelongsToMany':{                    
                        const tableName = Object.keys(models).reduce((acc,curr)=>{
                            if(models[curr].relationship.some(x=> x.association == 'BelongsToMany' && (x.model == r.model || x.model == j)))
                                acc.push(curr)
                            return acc
                        }, [])
                        options.through = tableName.join('_')
                        sequelize[i].instance.models[j].belongsToMany(sequelize[i].instance.models[r.model], options)
                    }break;
                }
            })
        }
    }
}

function notifyAuthenticate(key, value){
    sequelize[key].fnAuthenticate.forEach(x=>{x.call(this,value)})
}

function ChangeObject(old, current) {
    if(JSON.stringify(old) !== JSON.stringify(current))
        return true
    return false
}

function getValueByIndex(obj, index) {
    const keys = index.split('.');
    let value = obj;
    for (let key of keys) {
        if (value === undefined) {
            return "";
        }
        value = value[key];
    }
    return value;
}

class ExpressionNode {
    constructor() {
      this.logic = null;
      this.conditions = [];
    }

    setLogic(logic){
        this.logic = logic
    }
  
    addCondition(condition) {
      this.conditions.push(condition);
    }
  
    toSequelize() {
      if (this.conditions.length === 1) {
        return this.conditions[0].toSequelize ? this.conditions[0].toSequelize() : this.conditions[0];
      }
      return { [this.logic]: this.conditions.map(cond => cond.toSequelize ? cond.toSequelize() : cond) };
    }
  }

// Función para convertir una condición en una expresión compatible con sequelize
function convertToSequelizeWhere(conditions, msg) {  
    
    let expressionResult = []
    const logicExpressions = ['(', ')', 'or', 'and']
    conditions.forEach(cond => {
        const { logic1, field, expression, value, logic2, valueType } = cond;
        const conditionObject = { [field]: { [Op[expression]]: getValueFromInputType(valueType, value, msg) } };
        if(logicExpressions.some(x=> x == logic1))
            expressionResult.push(logic1)
        expressionResult.push(conditionObject)
        if(logicExpressions.some(x=> x == logic2))
            expressionResult.push(logic2)
    }) 
    const root = new ExpressionNode();
    let currentNode = root;
    const stack = [];
    expressionResult.forEach(item=>{
        if (item === '(') {
            const newNode = new ExpressionNode(Op.and);
            currentNode.addCondition(newNode);
            stack.push(currentNode);
            currentNode = newNode;
        } else if (item === ')') {
            currentNode = stack.pop();
        } else if (item === 'and' || item === 'or') {
            currentNode.logic = Op[item];
        } else {
            currentNode.addCondition(item);
        }
    })
    return root.toSequelize();
}

function getValueFromInputType(valueType, value, msg){
    switch (valueType) {
        case 'str':{
            return value
        }break;
        case 'num':{
            return  parseFloat(value)
        }break;
        case 'msg':{
            return  getValueByIndex(msg, value)
        }break;
        case 'json':{
            return  JSON.parse(value)
        }break;
        case 'date':{
            return  new Date(value)
        }break;
        case 'bool':{
            return  Boolean.parse(value)
        }break;
        default:
            return value
            break;
    }
    return valueType === 'str' ? value : parseFloat(value)
}
  
 