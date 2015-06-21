# geocoder.js

Fast offline coarse Geocoder based on GeoNames data.

## Usage

```js
var geocoder = require('geocoder');

geocoder('Big Apple', function (location) {
	/*
	{
		id: '5128581',
		name: 'New York City',
		country: 'US',
		latitude: '40.71427',
		longitude: '-74.00597',
		alternate: '0',
		population: '8175133'
	}
	*/

	console.log(location);
});
```

## Install

```shell
npm install geocoder.js
wget -q http://download.geonames.org/export/dump/countryInfo.txt -O ./node_modules/geocoder.js/data/geonames/countryInfo.txt && \
wget -q http://download.geonames.org/export/dump/cities1000.zip -O ./node_modules/geocoder.js/data/geonames/cities1000.zip && \
wget -q http://download.geonames.org/export/dump/alternateNames.zip -O ./node_modules/geocoder.js/data/geonames/alternateNames.zip && \
unzip ./node_modules/geocoder.js/data/geonames/cities1000.zip -d ./node_modules/geocoder.js/data/geonames/ && \
unzip ./node_modules/geocoder.js/data/geonames/alternateNames.zip -d ./node_modules/geocoder.js/data/geonames/ && \
rm ./node_modules/geocoder.js/data/geonames/*.zip && \
node ./node_modules/geocoder.js/data/build.js
```

## License

MIT
