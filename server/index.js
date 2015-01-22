var express = require('express');
var cors = require('cors');
var app = express();
var pg = require('pg');
var _ = require('underscore');
var moment = require('moment');
app.use(cors());
var obj = function() {
	return {
		values_way: [],
		values_node: [],
		values_relation: [],
		values_obj: [],
		values: [],
		key: null,
		color: null
	};
};
var conString = "postgres://postgres:1234@54.172.162.212/dbstatistic";
console.log("http://localhost:3021/");
var client = new pg.Client(conString);
client.connect(function(err) {
	if (err) {
		return console.error('could not connect to postgres', err);
	}
});
app.get('/:date', function(req, res) {
	try {
		var date = (req.params.date + '').split('&');
		var array_objs = [];
		var query_user = "SELECT iduser, osmuser, color, estado FROM osm_user";
		var main_query = client.query(query_user, function(error, result) {
			if (error) {
				console.log(error);
				res.statusCode = 404;
				return res.send('Error 404: No quote found');
			} else {
				for (var i = 0; i < result.rows.length; i++) {
					user = new obj();
					user.key = result.rows[i].osmuser;
					user.color = '#' + result.rows[i].color;
					array_objs.push(user);
				}
			}
		});
		var query = '';
		switch (date[0]) {
			case 'h':
				query = "SELECT u.osmuser, replace(substring(to_timestamp(o.osmdate)::text,9,5) || 'h',' ','-') as osmd, (o.node_v1 + o.node_vx) as node , (o.way_v1 + o.way_vx) as way, (o.relation_v1+ o.relation_vx) as relation" +
					" FROM osm_obj as o " +
					" INNER JOIN osm_user as u on  u.iduser =  o.iduser" +
					" WHERE o.osmdate>=" + date[1] + " AND o.osmdate<" + date[2] + " AND u.estado=true";
				/*query = "SELECT u.osmuser, replace(to_timestamp(o.osmdate)::text || 'h',' ','-') as osmd, (o.node_v1 + o.node_vx) as node , (o.way_v1 + o.way_vx) as way, (o.relation_v1+ o.relation_vx) as relation" +
					" FROM osm_obj as o " +
					" INNER JOIN osm_user as u on  u.iduser =  o.iduser" +
					" WHERE o.osmdate>=" + date[1] + " AND o.osmdate<" + date[2] + " AND u.estado=true";*/
				if ((parseInt(date[2]) - parseInt(date[1])) > 24 * 60 * 60 * 5) {
					return res.send('Error 404: No quote found');
				}
				break;
			case 'd':
				query = "SELECT u.osmuser, substring(to_timestamp(o.osmdate)::text,6,6) as osmd, sum(o.node_v1 + o.node_vx) as node , sum(o.way_v1 + o.way_vx) as way, sum(o.relation_v1+ o.relation_vx) as relation " +
					" FROM osm_obj as o  INNER JOIN osm_user as u on   u.iduser =  o.iduser " +
					" WHERE osmdate>= " + date[1] + " AND osmdate<" + date[2] + " AND u.estado=true " +
					" GROUP BY osmd,u.osmuser ORDER BY osmd;";
				if ((parseInt(date[2]) - parseInt(date[1])) > 24 * 60 * 60 * 30 * 3) {
					return res.send('Error 404: No quote found');
				}
				break;
			case 'm':
				query = " SELECT u.osmuser, substring(to_timestamp(o.osmdate)::text,0,8) as osmd, sum(o.node_v1 + o.node_vx) as node , sum(o.way_v1 + o.way_vx) as way, sum(o.relation_v1+ o.relation_vx) as relation " +
					" FROM osm_obj as o  INNER JOIN osm_user as u on   u.iduser =  o.iduser " +
					" WHERE osmdate>= " + date[1] + " AND osmdate<" + date[2] + " AND u.estado=true " +
					" GROUP BY osmd,u.osmuser ORDER BY osmd;"

				break;
			case 'y':
				query = " SELECT u.osmuser, substring(to_timestamp(o.osmdate)::text,0,5) as osmd, sum(o.node_v1 + o.node_vx) as node , sum(o.way_v1 + o.way_vx) as way, sum(o.relation_v1+ o.relation_vx) as relation  " +
					" FROM osm_obj as o  INNER JOIN osm_user as u on   u.iduser =  o.iduser " +
					" WHERE osmdate>= " + date[1] + " AND osmdate<" + date[2] + " AND u.estado=true " +
					" GROUP BY osmd,u.osmuser ORDER BY osmd";
				break;
		}
		console.log(query);
		client.query(query, function(error, result) {
			if (error) {
				console.log(error);
				res.statusCode = 404;
				return res.send('Error 404: No quote found');
			} else {
				for (var i = 0; i < result.rows.length; i++) {
					var userss = _.find(array_objs, function(obj) {
						return obj.key === result.rows[i].osmuser
					});
					// userss.values_way.push({
					// 	x: result.rows[i].osmd,
					// 	y: parseInt(result.rows[i].way)
					// });
					// userss.values_node.push({
					// 	x: result.rows[i].osmd,
					// 	y: parseInt(result.rows[i].node)
					// });
					// userss.values_relation.push({
					// 	x: result.rows[i].osmd,
					// 	y: parseInt(result.rows[i].relation)
					// });
					userss.values_obj.push({
						x: result.rows[i].osmd,
						y: parseInt(result.rows[i].relation) + parseInt(result.rows[i].way) + parseInt(result.rows[i].node)
					});
					userss.values.push({
						x: result.rows[i].osmd,
						y: parseInt(result.rows[i].relation) + parseInt(result.rows[i].way) + parseInt(result.rows[i].node)
					});


				}
				res.json(array_objs);
			}
		});
	} catch (e) {
		res.statusCode = 404;
		return res.send('Error 404: No quote found');
	}
});
app.listen(process.env.PORT || 3021);