# Relational Object Backup #

This app is a command line tool for exporting, and importing relational objects from Oracle Databases.
## Setup ##

### Prerequisites ###
* Node.js + NPM: https://nodejs.org/en/download/

Additionally, this node module uses node-oracledb, which requires the following:

* Python 2.7

* C Compiler with support for C++ 11 (Xcode, gcc, Visual Studio or similar)

* Oracle 11.2, 12.1 or 12.2 client libraries. Use the small, free Oracle Instant Client "basic" and "SDK" packages if your database is remote. Or use the libraries and headers from a locally installed database such as the free Oracle XE release.

* Set OCI_LIB_DIR and OCI_INC_DIR during installation if the Oracle libraries and headers are in a non-default location

For more information, see the installation guide for node-oracledb at: https://github.com/oracle/node-oracledb/blob/master/INSTALL.md

### Installation ###

After cloning, inside the "RelationalObjectBackup" project subdirectory, run:
```
npm install
```

This will install all required dependencies.

## Configuration ##

Inside the project folder, you will find a configuration file named "config.js". Below is the default configuration.

```
#!javascript
var config = {};

// Connection
config.dbConnectString = "localhost:1521/ORCL";         // [//]host_name[:port][/service_name][:server_type][/instance_name]
config.dbUsername = "\"characters\"";                   // Sometimes requires escaped quotations around the username. Try changing this if you are getting login errors.
config.dbPassword = "password";
config.schema = "\"characters\"";                       // Similar to username, may also require quotations.

// Are we exporting data, or importing it?
// Enabling both will only export data, as it is likely that your import settings will be different.
config.exportData = false;
config.importData = true;

config.dataFile = "characterData.json";                 // The output file for export, and the source file for import.

// Export - Methods
config.isBackupDB = false;                              // Set to true if this database connection is a previous backup.
config.flashbackAvailable = false;                      // Utilize's Oracle's Flashback feature for previous versions.
config.flashbackTime = '2017-01-01 00:00:00';           // The timestamp to use for flashback

// Export - Data
config.baseTable = "\"characters\"";                    // Similar to username, may also require quotations.
config.relatedField = "\"character_id\"";               // Similar to username, may also require quotations.
config.relateFieldValue = 2;
// These tables will be searched using "relatedField"
// These lookups will occur in the order defined here. Make sure they are ordered correctly to meet table constraints when re-importing.
// Similar to username, may also require quotations.
config.relatedTables = [
    "\"characters_achievement\"",
    "\"characters_currency\"",
    "\"characters_directive\"",
    "\"characters_directive_objective\"",
    "\"characters_directive_tier\"",
    "\"characters_directive_tree\"",
    "\"characters_event\"",
    "\"characters_friend\"",
    "\"characters_item\"",
    "\"characters_skill\"",
    "\"characters_stat\"",
    "\"characters_stat_history\"",
    "\"characters_weapon_stat\""
];

module.exports = config;
```

**Ensure this file is correctly configured before running the app!**

## Running the App ##

To run the app, simply execute the app.js script in a node environment:

```
node app.js 
```