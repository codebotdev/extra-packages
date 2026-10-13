'use strict';
'require baseclass';
'require fs';

var LOAD = '/sys/kernel/debug/qca-nss-drv/stats/cpu_load_ubi',
    ECM4 = '/sys/kernel/debug/ecm/ecm_nss_ipv4/accelerated_count',
    ECM6 = '/sys/kernel/debug/ecm/ecm_nss_ipv6/accelerated_count',
    THERMAL = '/sys/class/thermal',
    HWMON = '/sys/class/hwmon',
    previousCpu = null;

function read(path) {
	return L.resolveDefault(fs.read(path), null);
}

function parseCpu(text) {
	var cpus = {};
	(text || '').split('\n').forEach(function(line) {
		var fields = line.trim().split(/\s+/);
		if (!/^cpu\d*$/.test(fields[0]) || fields.length < 5)
			return;
		// Guest time is already included in user/nice; do not count it twice.
		var ticks = fields.slice(1, 9).map(Number);
		if (!ticks.every(function(v) { return Number.isFinite(v) && v >= 0; }))
			return;
		cpus[fields[0]] = {
			total: ticks.reduce(function(a, b) { return a + b; }, 0),
			idle: ticks[3] + (ticks[4] || 0)
		};
	});
	return cpus;
}

function sampleCpu(text) {
	if (text == null) {
		previousCpu = null;
		return [];
	}
	var current = parseCpu(text), old = previousCpu;
	previousCpu = current;
	return Object.keys(current).map(function(key) {
		var before = old && old[key], now = current[key], value = null;
		if (before && now.total > before.total && now.idle >= before.idle)
			value = Math.max(0, Math.min(100,
				100 * (1 - (now.idle - before.idle) / (now.total - before.total))));
		return { name: key == 'cpu' ? 'CPU' : key.toUpperCase(), value: value };
	});
}

function parseLoad(text) {
	var cores = [], core = null;
	(text || '').split('\n').forEach(function(line) {
		var m = line.match(/^Core (\d+):/);
		if (m) {
			core = m[1];
			return;
		}
		m = line.match(/^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
		if (core != null && m) {
			cores.push({ core: core, min: +m[1], avg: +m[2], max: +m[3] });
			core = null;
		}
	});
	return cores;
}

function temperature(raw) {
	return raw != null && /^-?\d+$/.test(raw.trim()) ? Number(raw.trim()) / 1000 : null;
}

function sensorName(type) {
	if (/^cpu|^cluster/.test(type)) return 'CPU';
	if (/^nss|^ubi32/.test(type)) return 'NSS';
	if (/^top[-_]glue/.test(type)) return 'SOC';
	if (/^gephy/.test(type)) return 'ETH';
	return type;
}

function readTemperatures() {
	return Promise.all([
		L.resolveDefault(fs.list(THERMAL), []).then(function(dirs) {
			return Promise.all(dirs.filter(function(d) {
				return /^thermal_zone\d+$/.test(d.name);
			}).map(function(d) {
				var path = THERMAL + '/' + d.name;
				return Promise.all([ read(path + '/type'), read(path + '/temp') ]).then(function(r) {
					return r[0] ? { name: sensorName(r[0].trim()), type: r[0].trim(),
						value: temperature(r[1]) } : null;
				});
			}));
		}),
		L.resolveDefault(fs.list(HWMON), []).then(function(dirs) {
			return Promise.all(dirs.filter(function(d) {
				return /^hwmon\d+$/.test(d.name);
			}).map(function(d) {
				var path = HWMON + '/' + d.name;
				return Promise.all([ read(path + '/name'), read(path + '/device/index'),
					L.resolveDefault(fs.list(path), []) ]).then(function(r) {
					var type = (r[0] || d.name).trim();
					return Promise.all(r[2].filter(function(f) {
						return /^temp\d+_input$/.test(f.name);
					}).map(function(f) {
						return Promise.all([ read(path + '/' + f.name),
							read(path + '/' + f.name.replace('_input', '_label')) ]).then(function(t) {
							var label = t[1] && t[1].trim(), name = sensorName(type),
								index = r[1] != null ? r[1].trim() : '';
							if (/^ath\d+k/.test(type))
								name = /^\d+$/.test(index) ? 'WIFI' + index : type + ' (' + d.name + ')';
							if (label || f.name != 'temp1_input')
								name += ' (' + (label || f.name.replace('_input', '')) + ')';
							return { name: name, type: type + (label ? ': ' + label : ''),
								key: type.replace(/_/g, '-') + ':' + f.name, value: temperature(t[0]) };
						});
					}));
				});
			}));
		})
	]).then(function(result) {
		var sensors = result[0].filter(Boolean), seen = {};
		sensors.forEach(function(s) { seen[s.type.replace(/_/g, '-') + ':temp1_input'] = true; });
		result[1].forEach(function(group) {
			group.forEach(function(s) {
				// Different radios share the same hwmon driver name. Only
				// deduplicate against thermal zones, not against other radios.
				if (!seen[s.key])
					sensors.push(s);
			});
		});
		var order = [ 'CPU', 'NSS', 'WIFI0', 'WIFI1', 'SOC', 'ETH' ];
		return sensors.sort(function(a, b) {
			var ai = order.indexOf(a.name), bi = order.indexOf(b.name);
			return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi) || a.name.localeCompare(b.name);
		});
	});
}

function percent(value) {
	return value == null ? '?' : '%.1f%%'.format(value);
}

function pills(pairs, title) {
	if (pairs.length == 1 && pairs[0][0] == null && pairs[0][1] == '?')
		return '?';
	return E('div', { 'class': 'nss-labels', 'title': title || '' }, pairs.map(function(p) {
		var children = [];
		if (p[0] != null)
			children.push(E('span', { 'class': 'nss-label' }, [ p[0] ]));
		children.push(E('span', { 'class': 'nss-value' }, [ p[1] ]));
		return E('span', { 'class': 'nss-pill', 'title': p[2] || '' }, children);
	}));
}

return baseclass.extend({
	title: _('Offload'),

	load: function() {
		return Promise.all([ read('/proc/stat').then(sampleCpu), read(LOAD),
			read(ECM4), read(ECM6), readTemperatures() ]);
	},

	render: function(data) {
		var cpus = data[0], cores = parseLoad(data[1]), unavailable = '?', rows = [];
		rows.push([ _('CPU usage'), pills(cpus.length ? cpus.map(function(c) {
			return [ c.name, percent(c.value) ];
		}) : [ [ null, unavailable ] ]) ]);
		if (!cores.length)
			rows.push([ _('NSS usage'), pills([ [ null, unavailable ] ]) ]);
		cores.forEach(function(c) {
			rows.push([ cores.length > 1 ? _('NSS core %s usage').format(c.core) : _('NSS usage'),
				pills([ [ 'AVG', percent(c.avg) ], [ 'MIN', percent(c.min) ],
					[ 'MAX', percent(c.max) ] ], _('Reported by NSS firmware')) ]);
		});
		function count(raw) {
			return raw != null && /^\d+$/.test(raw.trim()) ? raw.trim() : unavailable;
		}
		var ipv4 = count(data[2]), ipv6 = count(data[3]);
		rows.push([ _('ECM connections'),
			pills(ipv4 == unavailable && ipv6 == unavailable
				? [ [ null, unavailable ] ] : [ [ 'IPv4', ipv4 ], [ 'IPv6', ipv6 ] ]) ]);
		rows.push([ _('Temperature'), pills(data[4].length ? data[4].map(function(s) {
			return [ s.name, s.value == null ? unavailable : '%.1f°C'.format(s.value), s.type ];
		}) : [ [ null, unavailable ] ]) ]);
		return E('div', { 'class': 'nss-overview' }, [
			E('style', {}, `
.nss-overview .nss-labels { display:flex; flex-wrap:wrap; gap:4px 8px }
.nss-overview .nss-pill { display:inline-flex; align-items:stretch; border:1px solid var(--border-color-high,#ccc); border-radius:4px; overflow:hidden; font-size:0.9em; line-height:1.6 }
.nss-overview .nss-label { padding:0 6px; background:var(--primary-color-medium,var(--bar-bg,#2196f3)); color:var(--on-primary-color,#fff) }
.nss-overview .nss-value { padding:0 6px; min-width:3.5em; text-align:center; font-variant-numeric:tabular-nums }
`),
			E('table', { 'class': 'table' }, rows.map(function(r) {
				return E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ r[0] ]),
					E('td', { 'class': 'td left' }, [ r[1] ])
				]);
			}))
		]);
	}
});
