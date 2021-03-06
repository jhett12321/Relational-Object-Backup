﻿var config = {};

// Connection
config.dbConnectString = "localhost:1521/ORCL";         // [//]host_name[:port][/service_name][:server_type][/instance_name]
config.dbUsername = "\"characters\"";                   // Sometimes requires escaped quotations around the username. Try changing this if you are getting login errors.
config.dbPassword = "password";
config.schema = "\"characters\"";                       // Similar to username, may also require quotations.

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