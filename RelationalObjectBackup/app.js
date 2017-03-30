// Imports
var async = require('async');
var oracledb = require('oracledb');
var jsonfile = require('jsonfile');

var Config = require('./config.js');

// Database Connect
var db;

oracledb.getConnection({
    user: Config.dbUsername,
    password: Config.dbPassword,
    connectString: Config.dbConnectString
}, function (err, connection) {
    if (err)
    {
        Error(err.message);
    }
    else
    {
        // We successfully connected. Lets start Export/Import.
        db = connection;

        if (Config.exportData)
        {
            Export();
        }
        else if (Config.importData)
        {
            Import();
        }
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

    QueryTable(Config.baseTable, function (data) {
        exportObj.baseTable[Config.baseTable] = data;

        // Since we succeeded with our first query, we now move on to all related tables.
        // This is done in a series to ensure we do not break table constraints when we re-import.
        async.eachSeries(Config.relatedTables, function (tableName, callback) {
            QueryTable(tableName, function (err, data) {
                exportObj.relatedTables[tableName] = data;
                callback(err);
            });
        }, function (err) {
            if (err)
            {
                Error(err.message);
            }
            else
            {
                ExportToFile(exportObj);
            }
        });
    });
}

function QueryTable(tableName, cb)
{
    // Build our query
    var query = "SELECT * FROM " + Config.schema + "." + tableName + TryAppendFlashback() + " WHERE " + Config.relatedField + " = " + Config.relateFieldValue;
    console.log("Executing query: " + query);

    // Execute the query, and callback with results to be added to the working object.
    db.execute(query, function (err, result)
    {
        if (err)
        {
            console.log("Query Failed!");
            cb(err);
        }
        else
        {
            console.log("Query Completed Successfully.");
            cb(err, result.rows);
        }
    });
}

// Returns the flashback statement to be appended to a select, if we are configured to do so.
function TryAppendFlashback()
{
    if (!Config.isBackupDB && Config.flashbackAvailable)
    {
        return " AS OF TIMESTAMP TO_TIMESTAMP('" + Config.flashbackTime + "', 'YYYY-MM-DD HH:MI:SS')";
    }

    return "";
}

// Exports the given object to the configured file.
function ExportToFile(exportObj)
{
    jsonfile.writeFile(Config.dataFile, exportObj, { spaces: 4 }, function (err)
    {
        if (err)
        {
            console.log("Writing to JSON File failed!");
            Error(err);
        }
        else
        {
            ExitSuccessful();
        }
    });
}

function Import()
{
    console.log("Starting import of relational data...");

    // Load the JSON file into an object.
    jsonfile.readFile(Config.dataFile, function (err, importObj)
    {
        // Load the base table
        UpdateTables(importObj.baseTable, function()
        {
            // Load related tables.
            UpdateTables(importObj.relatedTables, function()
            {
                console.log("Committing changes...");

                db.commit(function(err)
                {
                    if (err)
                    {
                        Error(err.message);
                    }
                    else
                    {
                        ExitSuccessful();
                    }
                });


            });
        });
    });
}

function UpdateTables(tablesObj, cb)
{
    // To ensure we do not break cross-table constraints, we execute the insert statements in a series.
    async.eachOfSeries(tablesObj, function (rows, tableName, callback) {
        InsertData(tableName, rows, function (err) {
            callback(err);
        });
    }, function(err)
    {
        if (err)
        {
            Error(err.message);
            return;
        }

        cb();
    });
}

function InsertData(tableName, rows, cb)
{
    // Since we succeeded with our first query, we now move on to all related tables.
    // This is done in order to ensure we do not break table constraints when we re-import.
    async.eachSeries(rows, function (row, callback) {
        var query = "INSERT INTO " + Config.schema + "." + tableName + " VALUES (";

        // Add a bindable parameter for each column in this row.
        for (var i = 0; i < row.length; i++)
        {
            query += ":" + i + ", ";
        }

        // Remove the trailing space and comma.
        query = query.slice(0, -2);

        query += ")";

        // Make an array of the parameters we will pass in for binding.
        var params = [];

        for (var column in row)
        {
            if (row.hasOwnProperty(column))
            {
                params.push(row[column]);
            }
        }

        // Now that we have built the query, and value parameters, bind & execute it.
        // These changes are not committed immediately, so we can rollback if we run into an error.
        console.log("\nExecuting query: " + query);
        console.log("Bindings: " + params);

        db.execute(query, params, function (err, result) {
            if (err)
            {
                console.log("Query Failed!");
                Error(err.message);
            }
            else
            {
                console.log("Query Completed Successfully.");
                callback();
            }
        });
    }, function (err) {
        cb();
    });
}

function Error(message)
{
    console.error("DB Operations failed:");
    console.error(message);

    if (Config.importData)
    {
        console.error("No changes have been committed.");
    }

    CloseConnection();
}

function ExitSuccessful()
{
    console.log("DB Operations completed successfully!");
    CloseConnection();
}

// Closes our DB connection, and prompts the user to exit.
function CloseConnection(exitCode)
{
    db.close(function (err) {
        if (err)
        {
            console.error(err.message);
        }

        console.log('Press [Enter] to exit...');

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    });
}