This Node-RED node allows you to perform database queries using the Sequelize ORM. It supports all basic database operations through an intuitive graphical interface, eliminating the need to write any SQL code.

ORM tool for Postgres, MySQL, MariaDB, SQLite, Microsoft SQL Server, Oracle Database, Amazon Redshift and Snowflake’s Data Cloud. It features solid transaction support, relations, eager and lazy loading, read replication and more.

### Install
```
npm install node-red-contrib-orm-db
```
You'll also have to manually install the driver for your database of choice:
```
$ npm install --save pg pg-hstore # Postgres
$ npm install --save mysql2
$ npm install --save mariadb
$ npm install --save sqlite3
$ npm install --save tedious # Microsoft SQL Server
$ npm install --save oracledb # Oracle Database
```
### Outputs

1. Standard output
:payload (object) : the standard output of the operation.
2. Standard error
: payload (string) : the standard error of the operation.

### Details

The first step to using the node is to create the database connections and the models (database tables) to be used, 
and then proceed to perform all database operations. You only need to create a node with the type 'Create or Update Table' and then configure the server and database model.
`msg.payload` is used as the payload of the published message.

### Operation Types

1. **Create or Update Table**: This operation allows you to create or update database tables, enabling the creation of database connections and the structure of the tables. 
For creating fields and supported data types, refer to the Sequelize documentation [Sequelize Data-Types](https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types). 
Similarly, follow the same procedure when creating relationships between different models [Sequelize Associations](https://sequelize.org/docs/v6/core-concepts/assocs/).
2. **Synchronize Tables**: After creating the 'Create or Update Table' nodes, you can synchronize the models with the database using this type of node. 
There are three ways to synchronize the models with the database; refer to the Sequelize documentation [Sequelize Model Synchronization](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization). 
Using the node is optional since you may already have the database created, and its use in production can be very dangerous. When you use a node of this type, it has an input port which you can call from an 'inject' node, and it has two output ports: 
the first is used to indicate that the synchronization was successful, and the second for errors.
3. **Raw**: When queries are very complex and you can't handle them with the graphical interface, you can use this type of node to make direct queries to the database in SQL language. 
It has a 'Data' field that allows variable replacements in the query; refer to the Sequelize documentation for more details [Raw Queries](https://sequelize.org/docs/v6/core-concepts/raw-queries/). 
It's important to mention that it only supports replacements and not 'Bind Parameters'.
4. **Find All**: Searches in the selected model for all elements of the table. It allows filtering the information by including a 'Where' clause where the expressions can be dynamic fields passed in the input messages. 
If the 'Attributes' input does not have any fields selected, it will select all fields of the table. The 'Limit' and 'Offset' inputs will not be functional while set to 'false'; 
otherwise, they can be used with dynamic data from the input messages.
5. **Find and Count All**: Same as the previous one, but the result adds the total number of elements that meet the filtering criteria, if any.
6. **Find One**: Finds the first element that meets the filtering criteria in the 'Where' clause. If the 'Attributes' input does not have any fields selected, it will select all fields of the table.
7. **Add**: Allows adding elements to a table according to the selected model. The 'Data' input is used to configure the source of the data to be added, which can come from the input message in the node.
8. **Update**: Allows updating elements in a table according to the selected model. The 'Data' input is used to configure the source of the data to be updated, which can come from the input message in the node. 
You can specify the elements you want to update using the 'Where' input.
8. **Delete**: Deletes elements from a table according to the selected model. It is possible to include filtering according to the 'Where' input.
9. **Count**: Counts the elements in a table. It is also possible to include filtering by adding elements to the 'Where' input.
10. **Sum**: Sums the elements in a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the sum operation will be performed. It is also possible to filter data using the 'Where' input.
11. **Min**: Selects the minimum element from a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the minimum operation will be performed. It is also possible to filter data using the 'Where' input.
12. **Max**: Selects the maximum element from a table according to the selected model. The 'Attributes' input allows you to select the field of the model on which the maximum operation will be performed. It is also possible to filter data using the 'Where' input.
13. **Begin Transaction**: Transactions in relational databases are of utmost importance for data integrity. This type of node allows you to start a database transaction. 
It has only one output port, leaving the input message to the node unchanged and adding the variable msg.transaction with the transaction identifier. 
It is important to clarify that transactions should only be used with operations that make changes to the database, such as 'add', 'update', and 'delete'. For other operations, transactions have no effect.
14. **Commit Transaction**: Completes the transaction when the operations of previous nodes are successful.
15. **Rollback Transaction**: Completes the transaction when the operations of previous nodes result in an error.

### References

 - [Sequelize docs](https://sequelize.org/docs/v6/getting-started/)