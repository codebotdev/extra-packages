#!/bin/sh

. /lib/functions.sh

TAG="internet-check"
STATE_FILE="/var/run/internet-check.state"
LED_ROOT="/sys/class/leds"

enabled=1
method="ping"
interface=""
ping_target="223.5.5.5"
get_url="http://connect.rom.miui.com/generate_204"
online_led="blue:power"
offline_led="red:power"
blue_led="blue:power"
red_led="red:power"
green_led="green:power"
online_command=""
offline_command=""
interval=10
timeout=1

load_config() {
	config_load internet-check
	config_get_bool enabled main enabled 1
	config_get method main method ping
	config_get interface main interface
	config_get ping_target main ping_target 223.5.5.5
	config_get get_url main get_url http://connect.rom.miui.com/generate_204
	config_get online_led main online_led blue:power
	config_get offline_led main offline_led red:power
	config_get blue_led main blue_led blue:power
	config_get red_led main red_led red:power
	config_get green_led main green_led green:power
	config_get online_command main online_command
	config_get offline_command main offline_command
	config_get interval main interval 10
}

valid_uint() {
	case "$1" in
		''|*[!0-9]*|0) return 1 ;;
		*) return 0 ;;
	esac
}

valid_led_name() {
	case "$1" in
		''|.|..|*/*) return 1 ;;
		*) return 0 ;;
	esac
}

resolve_led() {
	case "$1" in
		blue|blue:power) printf '%s' "$blue_led" ;;
		red|red:power) printf '%s' "$red_led" ;;
		green|green:power) printf '%s' "$green_led" ;;
		none|'') ;;
		*) printf '%s' "$1" ;;
	esac
}

led_set() {
	local led="$1"
	local value="$2"
	local path

	valid_led_name "$led" || return 1
	path="$LED_ROOT/$led"
	[ -d "$path" ] || return 1
	[ ! -w "$path/trigger" ] || echo none > "$path/trigger"
	echo "$value" > "$path/brightness"
}

set_state() {
	local new_state="$1"
	local state_led
	local state_led_name
	local state_command

	case "$new_state" in
		online)
			state_led="$online_led"
			state_command="$online_command"
			;;
		offline)
			state_led="$offline_led"
			state_command="$offline_command"
			;;
	esac

	if [ "$state_led" != "none" ]; then
		state_led_name="$(resolve_led "$state_led")"
		led_set "$blue_led" 0 >/dev/null 2>&1 || true
		led_set "$red_led" 0 >/dev/null 2>&1 || true
		led_set "$green_led" 0 >/dev/null 2>&1 || true
		if ! led_set "$state_led_name" 1; then
			logger -t "$TAG" "LED '$state_led_name' is not available under $LED_ROOT"
		fi
	fi

	printf '%s\n' "$new_state" > "$STATE_FILE"
	logger -t "$TAG" "Network state changed to $new_state"

	if [ -n "$state_command" ] && ! /bin/sh -c "$state_command"; then
		logger -t "$TAG" "Command for $new_state state failed"
	fi
}

check_connectivity() {
	case "$method" in
		ping)
			if [ -n "$interface" ]; then
				ping -c 1 -W "$timeout" -q -I "$interface" "$ping_target" >/dev/null 2>&1
			else
				ping -c 1 -W "$timeout" -q "$ping_target" >/dev/null 2>&1
			fi
			;;
		get)
			if [ -n "$interface" ]; then
				curl -sS --max-time "$timeout" --output /dev/null \
					--interface "$interface" "$get_url" >/dev/null 2>&1
			else
				curl -sS --max-time "$timeout" --output /dev/null \
					"$get_url" >/dev/null 2>&1
			fi
			;;
		*)
			return 1
			;;
	esac
}

load_config
[ "$enabled" -eq 1 ] || exit 0

case "$method" in
	ping|get) ;;
	*) logger -t "$TAG" "Unsupported detection method: $method"; exit 1 ;;
esac

valid_uint "$interval" || interval=10

trap 'exit 0' INT TERM

state="unknown"

while :; do
	if check_connectivity; then
		if [ "$state" != "online" ]; then
			state="online"
			set_state "$state"
		fi
	else
		if [ "$state" != "offline" ]; then
			state="offline"
			set_state "$state"
		fi
	fi

	sleep "$interval" &
	wait $!
done
