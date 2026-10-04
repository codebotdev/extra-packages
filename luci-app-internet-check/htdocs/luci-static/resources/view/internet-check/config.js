'use strict';
'require dom';
'require form';
'require fs';
'require poll';
'require rpc';
'require view';
'require tools.widgets as widgets';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

function serviceStatus() {
	return Promise.all([
		L.resolveDefault(callServiceList('internet-check'), {}),
		L.resolveDefault(fs.trimmed('/var/run/internet-check.state'), 'unknown')
	]).then(function(data) {
		var running = data[0]?.['internet-check']?.instances?.main?.running;
		return { running: !!running, state: data[1] || 'unknown' };
	});
}

function renderStatus(status) {
	var text;
	var color;

	if (!status.running) {
		text = _('NOT RUNNING');
		color = 'red';
	} else if (status.state === 'online') {
		text = _('ONLINE');
		color = 'green';
	} else if (status.state === 'offline') {
		text = _('OFFLINE');
		color = 'red';
	} else {
		text = _('CHECKING');
		color = 'orange';
	}

	return E('em', {}, [
		E('span', { style: 'color:%s'.format(color) }, [
			E('strong', {}, [ _('Network status: %s').format(text) ])
		])
	]);
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('internet-check', _('Network Check'),
			_('Check Internet connectivity using Ping or HTTP GET, and optionally change an LED or run a command when the network state changes.'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function() {
			poll.add(function() {
				return serviceStatus().then(function(status) {
					var node = document.getElementById('internet_check_status');
					if (node)
						dom.content(node, renderStatus(status));
				});
			});

			return E('div', { class: 'cbi-section' }, [
				E('p', { id: 'internet_check_status' }, _('Collecting data…'))
			]);
		};

		s = m.section(form.NamedSection, 'main', 'internet-check', _('Settings'));
		s.tab('general', _('General Settings'));
		s.tab('leds', _('LED Settings'));

		o = s.taboption('general', form.Flag, 'enabled', _('Enable'));
		o.default = '1';
		o.rmempty = false;

		o = s.taboption('general', form.ListValue, 'method', _('Detection method'));
		o.value('ping', _('Ping'));
		o.value('get', _('HTTP GET'));
		o.default = 'ping';
		o.rmempty = false;

		o = s.taboption('general', widgets.DeviceSelect, 'interface', _('Interface'),
			_('Bind connectivity checks to this network device. Leave empty to use the routing table.'));
		o.rmempty = true;
		o.noaliases = true;

		o = s.taboption('general', form.Value, 'ping_target', _('Ping target'));
		o.default = '223.5.5.5';
		o.rmempty = false;
		o.depends('method', 'ping');

		o = s.taboption('general', form.Value, 'get_url', _('GET URL'));
		o.default = 'http://connect.rom.miui.com/generate_204';
		o.rmempty = false;
		o.depends('method', 'get');
		o.validate = function(sectionId, value) {
			return /^https?:\/\/\S+$/.test(value) ? true : _('The URL must start with http:// or https://.');
		};

		function addLedOption(name, title, defaultValue) {
			var led = s.taboption('general', form.ListValue, name, title);
			led.value('none', _('None'));
			led.value('blue:power', _('Blue'));
			led.value('red:power', _('Red'));
			led.value('green:power', _('Green'));
			led.default = defaultValue;
			led.rmempty = false;
			return led;
		}

		addLedOption('online_led', _('LED when online'), 'blue:power');
		addLedOption('offline_led', _('LED when offline'), 'red:power');

		function addLedMapping(name, title, defaultValue) {
			var led = s.taboption('leds', form.Value, name, title,
				_('LED name under /sys/class/leds/.'));
			led.default = defaultValue;
			led.rmempty = false;
			led.validate = function(sectionId, value) {
				return value && value !== '.' && value !== '..' && value.indexOf('/') < 0
					? true : _('Enter an LED name without slashes.');
			};
			return led;
		}

		addLedMapping('blue_led', _('Blue LED name'), 'blue:power');
		addLedMapping('red_led', _('Red LED name'), 'red:power');
		addLedMapping('green_led', _('Green LED name'), 'green:power');

		o = s.taboption('general', form.Value, 'online_command', _('Command when online'));
		o.rmempty = true;

		o = s.taboption('general', form.Value, 'offline_command', _('Command when offline'));
		o.rmempty = true;

		o = s.taboption('general', form.Value, 'interval', _('Check interval'));
		o.default = '10';
		o.datatype = 'range(1,3600)';
		o.rmempty = false;

		return m.render();
	}
});
