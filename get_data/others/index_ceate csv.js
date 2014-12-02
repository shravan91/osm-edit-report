var osmium = require('osmium');
var numeral = require('numeral');
var argv = require('optimist').argv;
var _ = require('underscore');
var fs = require('fs');
var moment = require('moment');

var obj_way = function() {
	return {
		highways: {
			v1: 0,
			vx: 0,
			oneways: 0,
			bridges: 0
		},
		buildings: {
			v1: 0,
			vx: 0
		}
	};
};

function format_num(n) {
	return numeral(n).format('0,0');
}
var osmfile = argv.osmfile;
var users = argv.users.split(",");
var count = {};
for (var k = 0; k < users.length; k++) {
	var way = {
		way: new obj_way()
	};
	count[users[k]] = way;
};

var file = new osmium.File(osmfile);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
var day, hour = '';
var check_hour = true;
handler.on('way', function(way) {
	if (check_hour) {
		console.log(way.timestamp);
		var date = new Date(parseFloat(way.timestamp) * 1000);
		console.log(date);
		hour = date.getHours();
		console.log('hour:' + hour);
		//day = moment.unix(way.timestamp).format('YYYY-MM-DD');
		day = date.getUTCFullYear() + '-' + (parseInt(date.getUTCMonth()) + 1) + '-' + date.getUTCDate();
		console.log(day);
		check_hour = false;
	}
	if ((typeof way.tags().highway !== 'undefined' || typeof way.tags().building !== 'undefined') && users.indexOf(way.user) !== -1) { //evalua las calles	
		if (way.version === 1) {
			++count[way.user].way.highways.v1;
		} else {
			++count[way.user].way.highways.vx;
		}
	}
});


reader.apply(handler);

var array_total = [];
for (var i = 0; i < users.length; i++) {
	array_total.push(count[users[i]].way.highways.v1 + count[users[i]].way.highways.vx);
};

var file = "server/data/" + day + '.csv'; //name of day
fs.exists(file, function(exists) {
	if (!exists) {
		var wstream = fs.createWriteStream(file);
		wstream.write('hour,' + users.toString() + '\n');
		wstream.write(hour + ',' + array_total.toString() + '\n');
		wstream.end();
	} else {
		fs.appendFile(file, hour + ',' + array_total.toString() + '\n');
	}
});