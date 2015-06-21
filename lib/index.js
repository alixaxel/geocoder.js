'use strict';

var _ = require('lodash'),
	db = require('dblite').withSQLite('3.8.6+')(__dirname + '/../data/geonames.db', '-header'),
	async = require('async');

db.on('close', function (code) {
	if (code !== 0) {
		console.error(code);
	}
});

module.exports = function (location, callback) {
	var query = [
		'SELECT * FROM "location" WHERE "id" IN (',
		'	SELECT "id" FROM "location" WHERE "name" LIKE ? ORDER BY "alternate" ASC, "population" DESC LIMIT 1',
		') ORDER BY "alternate" ASC, "_rowid_" ASC LIMIT 1;'
	];

	db.query(query.join("\n"), [location], function (error, rows) {
		if (_.size(rows) > 0) {
			db.close(); return callback(_.get(rows, 0, null));
		} else {
			var query = [
				'SELECT * FROM "location" WHERE "id" IN (',
				'	SELECT "id" FROM "location_fts" WHERE "name" MATCH ? ORDER BY "alternate" ASC, "population" DESC LIMIT 1',
				') ORDER BY "alternate" ASC, "_rowid_" ASC LIMIT 1;'
			];

			db.query(query.join("\n"), [location], function (error, rows) {
				db.close(); return callback(_.get(rows, 0, null));
			});
		}
	});
};
