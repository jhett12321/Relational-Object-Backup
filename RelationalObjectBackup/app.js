// Imports
var async = require('async');
var oracledb = require('oracledb');
var jsonfile = require('jsonfile');

var Config = require('./config.js');

// Database Connect
oracledb.outFormat = oracledb.OBJECT; // Makes it easier to import later at the cost of a larger file size.
var db;

oracledb.getConnection({
    user: Config.dbUsername,
    password: Config.dbPassword,
    connectString: Config.dbConnectString
}, function (err, connection) {
    if (err)
    {
        Error(err.message);
        return;
    }

    // We successfully connected. Lets start Export/Import.
    db = connection;

    if (config.exportData)
    {
        Export();
    }
    else if (config.importData)
    {
        // Import();
    }
});

function Export()
{
    console.log("Exporting relational data...");

    // Create the JSON object that our data will be written to.
    var exportObj =
    {
        baseTable: {},
        relatedTables: {}
    }

    // Initial query - resolve data from base table;
    console.log("Querying table ");

    QueryTable(Config.baseTable, function (data)
    {
        exportObj.baseTable[Config.baseTable] = data;

        // Since we succeeded with our first query, we now move on to all related tables.
        // This is done in order to ensure we do not break table constraints when we re-import.
        async.eachSeries(Config.relatedTables, function (tableName, callback) {
            QueryTable(tableName, function (data) {
                exportObj.relatedTables[tableName] = data;
                callback();
            });
        }, function (err) {
            if (err)
            {
                Error(err.message);
                return;
            }

            ExportToFile(exportObj);
        });
    });
}

function QueryTable(tableName, cb)
{
    var query = "SELECT * FROM :table_name" + TryAppendFlashback() + " WHERE :related_field = :related_value";
    var params =
    {
        table_name: tableName,
        related_field: Config.relatedField,
        related_value: Config.relatedValue,
        flashback_time: Config.flashbackTime
    }

    console.log("Executing query: " + query);
    console.log("Bindings: " + params);

    db.execute(query, params, function (err, result)
    {
        if (err)
        {
            console.log("Query Failed!");
            Error(err.message);
        }
        else
        {
            console.log("Query Completed Successfully.");
            cb(result.rows);
        }
    });
}

function TryAppendFlashback()
{
    if (!Config.isBackupDB && Config.flashbackAvailable)
    {
        return " AS OF TIMESTAMP TO_TIMESTAMP(:flashback_time, 'YYYY-MM-DD HH:MI:SS')";
    }

    return "";
}

function ExportToFile(exportObj)
{
    jsonfile.writeFile(Config.dataFile, exportObj, { spaces: 4 }, function (err)
    {
        if (err)
        {
            console.log("Writing to JSON File failed!");
            Error(err);
        }
    });
}

function Error(message)
{
    console.error(message);
    CloseConnection();
    process.exit(1);
}

function CloseConnection()
{
    db.close(function (err) {
        if (err)
        {
            console.error(err.message);
        }
    });
}