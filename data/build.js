'use strict';

var _ = require('lodash'),
	fs = require('fs'),
	db = require('dblite').withSQLite('3.8.6+')(__dirname + '/../data/geonames.db', '-header'),
	async = require('async'),
	lineReader = require('line-reader');

db.on('close', function (code) {
	if (code !== 0) {
		console.error(code);
	}
});

db.query([
	'CREATE TABLE IF NOT EXISTS "location" (',
	'	"id" INTEGER,',
	'	"name" TEXT COLLATE NOCASE,',
	'	"country" TEXT,',
	'	"latitude" REAL,',
	'	"longitude" REAL,',
	'	"alternate" INTEGER,',
	'	"population" INTEGER',
	');'
].join("\n"));

async.series({
	cities: function (done) {
		var i = 0,
			id = null,
			rows = [];

		lineReader.eachLine(__dirname + '/../data/geonames/cities1000.txt', function (line) {
			if (_.size(line = line.split("\t")) === 19) {
				var names = _.uniq(_.values(_.pick(line, [1, 2])), false, function (name) {
					return name.toLowerCase();
				});

				_.forEach(names, function (name) {
					rows.push({
						id: _.get(line, 0, null),
						name: name,
						country: _.get(line, 8, null),
						latitude: _.get(line, 4, null),
						longitude: _.get(line, 5, null),
						alternate: 0,
						population: _.get(line, 14, null)
					});
				});

				names = _.filter(_.difference(_.uniq(_.get(line, 3, null).split(',')), names), _.size);

				_.forEach(names, function (name) {
					if (/^https?:/i.test(name) !== true) {
						rows.push({
							id: _.get(line, 0, null),
							name: name,
							country: _.get(line, 8, null),
							latitude: _.get(line, 4, null),
							longitude: _.get(line, 5, null),
							alternate: 1,
							population: _.get(line, 14, null)
						});
					}
				});
			}
		}).then(function () {
			async.eachSeries(rows, function (row, callback) {
				if (i++ % 4096 === 0) {
					db.query('BEGIN;');
				}

				try {
					db.query(
						'INSERT INTO "location" VALUES (?, ?, ?, ?, ?, ?, ?);',
						[row.id, row.name, row.country, row.latitude, row.longitude, row.alternate, row.population],
						function (error) {
							if (error) {
								console.log(error);
							}

							callback();
						}
					);
				} catch (error) {
					callback(error);
				}

				if (i % 4096 === 0) {
					db.query('COMMIT;');
				}
			}, function (error) {
				if (error) {
					console.log(error);
				}

				if (i % 4096 !== 0) {
					db.query('COMMIT;');
				}

				var queries = [
					'CREATE INDEX IF NOT EXISTS "location|id" ON "location" ("id");',
					'CREATE INDEX IF NOT EXISTS "location|name" ON "location" ("name");',
					'CREATE INDEX IF NOT EXISTS "location|country" ON "location" ("country");',
					'CREATE INDEX IF NOT EXISTS "location|alternate" ON "location" ("alternate");',
					'CREATE INDEX IF NOT EXISTS "location|population" ON "location" ("population");'
				];

				_.forEach(queries, function (query) {
					db.query(query);
				});

				done(null, true);
			});
		});
	},
	countries: function (done) {
		var i = 0,
			id = null,
			countries = {};

		lineReader.eachLine(__dirname + '/../data/geonames/countryInfo.txt', function (line, last, next) {
			var query = [
				'SELECT * FROM "location" WHERE "name" LIKE ? AND "country" LIKE ? ORDER BY "alternate" ASC, "population" DESC LIMIT 1;'
			].join("\n");

			if ((_.size(line = line.split("\t")) === 19) && (/^[0-9]+$/.test(id = _.get(line, 16, null)) === true) && (_.size(_.get(line, 5, null)) > 0)) {
				db.query(query, [_.get(line, 5, null), _.get(line, 0, null)], function (error, rows) {
					var row = _.first(rows);

					if (_.isPlainObject(row) === true) {
						countries[id] = [
							{
								id: _.get(line, 16, null),
								name: _.get(line, 4, null),
								country: row.country,
								latitude: row.latitude,
								longitude: row.longitude,
								alternate: 0,
								population: _.get(line, 7, null)
							}
						];
					}

					next();
				});
			} else {
				next();
			}
		}).then(function () {
			lineReader.eachLine(__dirname + '/../data/geonames/alternateNames.txt', function (line) {
				line = line.split("\t");

				if ((_.has(countries, id = _.get(line, 1, null)) === true) && (/^https?:/i.test(_.get(line, 3, null)) !== true)) {
					countries[id].push(_.merge({}, countries[id][0], {
						name: _.get(line, 3, null),
						alternate: 1
					}));
				}
			}).then(function () {
				countries = _.flatten(_.values(countries));

				async.eachSeries(countries, function (row, callback) {
					if (i++ % 4096 === 0) {
						db.query('BEGIN;');
					}

					try {
						db.query(
							'INSERT INTO "location" VALUES (?, ?, ?, ?, ?, ?, ?);',
							[row.id, row.name, row.country, row.latitude, row.longitude, row.alternate, row.population],
							function (error) {
								if (error) {
									console.log(error);
								}

								callback();
							}
						);
					} catch (error) {
						callback(error);
					}

					if (i % 4096 === 0) {
						db.query('COMMIT;');
					}
				}, function (error) {
					if (error) {
						console.log(error);
					}

					if (i % 4096 !== 0) {
						db.query('COMMIT;');
					}

					done(null, true);
				});
			});
		});
	}
}, function(error, results) {
	var queries = [
		'CREATE VIRTUAL TABLE IF NOT EXISTS "location_fts" USING fts4("id" INTEGER, "name" TEXT, "country" TEXT, "alternate" INTEGER, "population" INTEGER);',
		'INSERT INTO "location_fts" SELECT "id", "name", "country", "alternate", "population" FROM "location";'
	];

	_.forEach(queries, function (query) {
		db.query(query);
	});

	db.close();

	if (error) {
		console.log(error);
	}

	console.log(results);
});
