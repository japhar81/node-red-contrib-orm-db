This Node-RED node allows you to perform database queries using the Sequelize ORM. It supports all basic database operations through an intuitive graphical interface, eliminating the need to write any SQL code.

ORM tool for Postgres, MySQL, MariaDB, SQLite, Microsoft SQL Server, Oracle Database, Amazon Redshift and Snowflake’s Data Cloud. It features solid transaction support, relations, eager and lazy loading, read replication and more.

### Install
node-red-contrib-orm-db is available in the Node-RED Palette Manager. To install it:

* Open the menu in the top-right of Node-RED
* Click "Manage Palette"
* Switch to the "Install" tab
* Search node-red-contrib-orm-db
* Install the node-red-contrib-orm-db package
The nodes will then be available in your editor for you to get started.

It is also possible to install it via npm:
```
npm install node-red-contrib-orm-db
```

You'll also have to manually install the driver for your database of choice, sqlite already comes by default:
```
$ npm install --save pg pg-hstore # Postgres
$ npm install --save mysql2
$ npm install --save mariadb
$ npm install --save sqlite3
$ npm install --save tedious # Microsoft SQL Server
$ npm install --save oracledb # Oracle Database
```

### Inputs

: payload (string | object) :  the payload of the message to publish.


### Outputs

1. Standard output
: payload (object) : the standard output of the operation.

### Details

The first step to using the node is to create the database connections and the models (database tables) to be used, 
and then proceed to perform all database operations.
`msg.payload` is used as the payload of the published message.

### Operation Types
1. **Raw**: When queries are very complex and you can't handle them with the graphical interface, you can use this type of node to make direct queries to the database in SQL language. 
It has a 'Data' field that allows variable replacements in the query; refer to the Sequelize documentation for more details [Raw Queries](https://sequelize.org/docs/v6/core-concepts/raw-queries/). 
It's important to mention that it only supports replacements and not 'Bind Parameters'.
2. **Find All**: Searches in the selected model for all elements of the table. It allows filtering the information by including a 'Where' clause where the expressions can be dynamic fields passed in the input messages. 
If the 'Attributes' input does not have any fields selected, it will select all fields of the table. The 'Limit' and 'Offset' inputs will not be functional while set to 'false'; 
otherwise, they can be used with dynamic data from the input messages.
3. **Find and Count All**: Same as the previous one, but the result adds the total number of elements that meet the filtering criteria, if any.
4. **Find One**: Finds the first element that meets the filtering criteria in the 'Where' clause. If the 'Attributes' input does not have any fields selected, it will select all fields of the table.
5. **Add**: Allows adding elements to a table according to the selected model. The 'Data' input is used to configure the source of the data to be added, which can come from the input message in the node.
6. **Bulk Create**: Allows you to create in bulk. The 'Data' input is used to configure the source of the data to be added, which can come from the input message in the node.
7. **Update**: Allows updating elements in a table according to the selected model. The 'Data' input is used to configure the source of the data to be updated, which can come from the input message in the node. 
You can specify the elements you want to update using the 'Where' input. Returns true if the operation is performed correctly in the database
8. **Delete**: Deletes elements from a table according to the selected model. It is possible to include filtering according to the 'Where' input. Returns true if the operation is performed correctly in the database.
9. **Count**: Counts the elements in a table. It is also possible to include filtering by adding elements to the 'Where' input.
10. **Sum**: Sums the elements in a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the sum operation will be performed. It is also possible to filter data using the 'Where' input.
11. **Min**: Selects the minimum element from a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the minimum operation will be performed. It is also possible to filter data using the 'Where' input.
12. **Max**: Selects the maximum element from a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the maximum operation will be performed. It is also possible to filter data using the 'Where' input.
13. **Begin Transaction**: Transactions in relational databases are of utmost importance for data integrity. This type of node allows you to start a database transaction. 
It has only one output port, leaving the input message to the node unchanged and adding the variable msg.transaction with the transaction identifier. 
It is important to clarify that transactions should only be used with operations that make changes to the database, such as 'add', 'update', and 'delete'. For other operations, transactions have no effect.
14. **Commit Transaction**: Completes the transaction when the operations of previous nodes are successful.
15. **Rollback Transaction**: Completes the transaction when the operations of previous nodes result in an error.
16. **Synchronize Tables**: After creating the connections and models, you can synchronize the models with the database using this type of node. 
There are three ways to synchronize the models with the database; refer to the Sequelize documentation [Sequelize Model Synchronization](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization). 
Using the node is optional since you may already have the database created, and its use in production can be very dangerous. When you use a node of this type, it has an input port which you can call from an 'inject' node, and it has two output ports: 
the first is used to indicate that the synchronization was successful, and the second for errors.

### Properties of the "orm-db" node

* **Name**: Node name, the node type is also added
* **Model**: Allows you to select the model on which the operations are performed.
* **Type**: Type of operation to be performed, check the "Operation Types" header.
* **Where**: It allows you to add filtering to operations such as search, delete, update, and count. It is important to pay close attention to the parentheses and the "and" and "or" operations. If a value of type 'null' needed to be added in the expression, the data type 'string' should be selected, and the value 'null' should be entered.
* **Attributes**: You can select for some operations the attributes you want to return in the query.
* **Limit**: You can set limits on the number of items that the query will return. This value can be set either statically (with a number) or dynamically as part of the input message (msg.limit). Very useful for doing server-side pagination.
* **Offset**: You can set from which position in the response list the data will be returned. It is possible to set this value either statically (with a number) or dynamically as part of the input message (msg.limit). Very useful for doing server-side pagination.
* **Order**: Sorts response items by selected fields.
* **Include**: For search operations, it allows you to include other models that are related to the current model. It is also possible to add the related model directly when adding elements. Check the examples for the case of adding.
* **Data**:  Allows you to configure the data source for add, update, delete and raw query operations.

### Dynamic connection

It is possible to establish dynamic connections to different databases at runtime. The connection string must be sent via `msg.connection` in the following format:
```
{
    "driver": "mysql", // Connection driver, one of "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql" | "db2" | "snowflake" | "oracle"
    "host": "localhost",
    "port": "",
    "username": "",
    "password": "",
    "database": "test" // Database name, in the case of sqlite, add the file path and if left empty it is used as an in-memory database
}
```

### Examples

Review the node examples for more clarity on how to use it. You can import it in the import menu and search for the node example "node-red-contrib-orm-db" or the json for the site [GitHub](https://github.com/asielh1n1/node-red-contrib-orm-db/blob/main/examples/example.json).
If you run them in the order they appear it should work without problems.

### References

 - [Sequelize docs](https://sequelize.org/docs/v6/getting-started/)